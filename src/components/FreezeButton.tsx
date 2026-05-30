import React from 'react';
import { Button, ButtonProps, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import { selectIsCurrentElectionFrozen } from '../redux/slices/electionSlice';
import { LockOutlined } from '@ant-design/icons';

interface FreezeButtonProps extends ButtonProps {
  /**
   * Type of operation (for custom messaging)
   */
  operation?: 'create' | 'update' | 'delete' | 'upload' | 'import' | 'export';
  /**
   * If true, button is disabled only when frozen
   * If false, button behavior is not affected by freeze status
   */
  freezeProtected?: boolean;
}

/**
 * Button component that automatically disables when election is frozen
 * Shows tooltip explaining why it's disabled
 * 
 * @example
 * <FreezeButton type="primary" onClick={handleSave} operation="create">
 *   Save Voter
 * </FreezeButton>
 */
export const FreezeButton: React.FC<FreezeButtonProps> = ({
  freezeProtected = true,
  operation,
  disabled,
  children,
  ...buttonProps
}) => {
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);
  
  const isDisabled = freezeProtected ? (disabled || isFrozen) : disabled;
  
  const getTooltipMessage = () => {
    if (!isFrozen || !freezeProtected) return '';
    
    const operationText = operation || 'this action';
    return `Cannot ${operationText}. Election is frozen and in read-only mode.`;
  };

  const button = (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      icon={isFrozen && freezeProtected ? <LockOutlined /> : buttonProps.icon}
    >
      {children}
    </Button>
  );

  if (isFrozen && freezeProtected) {
    return (
      <Tooltip title={getTooltipMessage()}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default FreezeButton;
