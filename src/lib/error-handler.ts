export const getSafeErrorMessage = (error: unknown): string => {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Authentication errors - prevent user enumeration
  if (msg.includes('auth') || msg.includes('jwt') || msg.includes('token') || 
      msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
    return 'Authentication failed. Please check your credentials and try again.';
  }
  
  if (msg.includes('email') && (msg.includes('confirm') || msg.includes('verify'))) {
    return 'Please check your email to verify your account.';
  }
  
  // Database errors - hide schema details
  if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already exists')) {
    return 'This record already exists.';
  }
  
  if (msg.includes('violates') || msg.includes('constraint') || msg.includes('check') || msg.includes('foreign key')) {
    return 'Invalid data provided. Please check your input.';
  }
  
  if (msg.includes('relation') || msg.includes('table') || msg.includes('column')) {
    return 'A database error occurred. Please try again.';
  }
  
  // Network errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('connection')) {
    return 'Connection error. Please check your internet and try again.';
  }
  
  // Permission errors
  if (msg.includes('permission') || msg.includes('denied') || msg.includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Keep amount validation errors for better UX (already sanitized)
  if (msg.includes('amount must')) {
    return error instanceof Error ? error.message : String(error);
  }
  
  // Generic fallback - never expose raw errors
  return 'An unexpected error occurred. Please try again later.';
};
