import React from 'react';
import { ExpressStepPackage } from './ExpressStepPackage';
import { ExpressStepRoute } from './ExpressStepRoute';
import { ExpressStepPayment } from './ExpressStepPayment';
import {
  PACKAGE_TYPES,
  type ExpressFormFieldsProps,
  type ExpressFormHandlers,
  type ExpressFormState,
} from './expressForm.types';

export { PACKAGE_TYPES };
export type { ExpressFormFieldsProps, ExpressFormHandlers, ExpressFormState };

export const ExpressFormFields: React.FC<ExpressFormFieldsProps> = ({
  currentStep,
  state,
  handlers,
}) => {
  if (currentStep === 1) {
    return <ExpressStepPackage state={state} handlers={handlers} />;
  }
  if (currentStep === 2) {
    return <ExpressStepRoute state={state} handlers={handlers} />;
  }
  return <ExpressStepPayment state={state} onSelectPayer={handlers.setPayerRole} />;
};
