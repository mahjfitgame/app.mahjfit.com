export interface ConfirmationDialogDataType {
    icon?: string;
    titleKey: string;
    messageKey: string;
    confirmLabelKey: string;
    cancelLabelKey?: string;
    params?: Record<string, unknown>;
    danger?: boolean;
}
