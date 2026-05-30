import { AppDispatch } from "../redux/store";
import { getAllElectionsApi } from "../api/electionApi";
import {
  updateAllElections,
  updateSelectedElectionId,
} from "../redux/slices/electionSlice";

let electionsRequestPromise: Promise<any[]> | null = null;

export const getAllElections = async (
  dispatch: AppDispatch,
  electionId?: string
) => {
  const savedElections = localStorage.getItem("elections");
  if (savedElections) {
    const electionsFromLocalStorage = JSON.parse(savedElections);
    console.log("Loaded elections from localStorage:", electionsFromLocalStorage);
    dispatch(updateAllElections(electionsFromLocalStorage));
    if (electionId) dispatch(updateSelectedElectionId(electionId));
    return electionsFromLocalStorage;
  }

  if (!electionsRequestPromise) {
    electionsRequestPromise = getAllElectionsApi()
      .then((data) => {
        console.log("response of getAllElectionsApi()", data);
        return data.data;
      })
      .finally(() => {
        electionsRequestPromise = null;
      });
  }

  const elections = await electionsRequestPromise;
  dispatch(updateAllElections(elections));
  console.log("electionId", electionId);
  if (electionId) dispatch(updateSelectedElectionId(electionId));
  return elections;
};

/**
 * Formats a number according to Indian numbering system
 * @param num - The number to format
 * @returns Formatted string with Indian comma placement (e.g., 2,66,050 or 94,128)
 */
export const formatIndianNumber = (
  num: number | string | undefined | null
): string => {
  if (num === undefined || num === null || num === '') return '0';

  const numStr = String(num).trim();
  if (numStr === '' || isNaN(Number(numStr))) return '0';

  const isNegative = Number(numStr) < 0;
  const absoluteStr = numStr.replace('-', '');

  let [integerPart, decimalPart] = absoluteStr.split('.');

  // Truncate to max 2 decimal digits (NO rounding)
  if (decimalPart) {
    decimalPart = decimalPart.slice(0, 2);
    if (decimalPart === '') decimalPart = undefined;
  }

  if (integerPart.length <= 3) {
    return (
      (isNegative ? '-' : '') +
      integerPart +
      (decimalPart ? `.${decimalPart}` : '')
    );
  }

  const lastThree = integerPart.slice(-3);
  let otherDigits = integerPart.slice(0, -3);
  otherDigits = otherDigits.replace(/\B(?=(\d{2})+$)/g, ',');

  return (
    (isNegative ? '-' : '') +
    otherDigits +
    ',' +
    lastThree +
    (decimalPart ? `.${decimalPart}` : '')
  );
};
