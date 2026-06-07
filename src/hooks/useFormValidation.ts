import { useState, useCallback } from 'react';

interface ValidationRules {
  email?: (value: string) => string | null;
  password?: (value: string) => string | null;
}

export const useFormValidation = (initialValues: Record<string, string>, rules: ValidationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate field if rule exists
    if (rules[name as keyof ValidationRules]) {
      const validationError = rules[name as keyof ValidationRules]?.(value);
      setErrors(prev => ({
        ...prev,
        [name]: validationError || ''
      }));
    }
  }, [rules]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(rules).forEach(key => {
      const rule = rules[key as keyof ValidationRules];
      if (rule) {
        const error = rule(values[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    handleChange,
    validateForm,
    resetForm
  };
};