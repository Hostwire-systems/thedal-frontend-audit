import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectIsCurrentElectionFrozen } from '../redux/slices/electionSlice';

interface FreezeGuardProps {
  children: ReactNode;
  /**
   * If true, shows children only when election is frozen (inverse behavior)
   */
  inverse?: boolean;
  /**
   * Fallback content to show when children are hidden
   */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on election freeze status
 * By default, hides children when election is frozen (write operations)
 * 
 * @example
 * // Hide write buttons when frozen
 * <FreezeGuard>
 *   <Button onClick={handleEdit}>Edit</Button>
 * </FreezeGuard>
 * 
 * @example
 * // Show only when frozen (with fallback)
 * <FreezeGuard inverse fallback={<Text>Available</Text>}>
 *   <Tag color="orange">Frozen</Tag>
 * </FreezeGuard>
 */
export const FreezeGuard: React.FC<FreezeGuardProps> = ({ 
  children, 
  inverse = false,
  fallback = null 
}) => {
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);
  
  const shouldShow = inverse ? isFrozen : !isFrozen;
  
  return shouldShow ? <>{children}</> : <>{fallback}</>;
};

export default FreezeGuard;
