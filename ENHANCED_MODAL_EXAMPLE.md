# Enhanced Modal Example - Phase 1 Patterns

## Example: Upgrading InvitationModal to Phase 1 Standards

This example shows how to apply Phase 1 UX improvements to an existing modal using the InvitationModal as a reference.

### Current Implementation Issues:
1. Manual validation with basic error checking
2. Inconsistent toast usage (importing `toast` directly)
3. No real-time validation feedback
4. No loading progress indicators
5. Basic error handling

### Enhanced Implementation:

```typescript
// Updated imports
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from './forms';
import { toastService } from '../utils/toast';
import { SkeletonCard } from './skeletons';
import LoadingSpinner from './LoadingSpinner';

// Validation schema
const invitationValidationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['PLATFORM_ADMIN', 'ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'PROPERTY_MANAGER', 'DEPARTMENT_ADMIN', 'STAFF']),
  departmentId: z.string().optional(),
  propertyId: z.string().optional(),
}).refine((data) => {
  // Department required for certain roles
  if (['STAFF', 'DEPARTMENT_ADMIN'].includes(data.role) && !data.departmentId) {
    return false;
  }
  return true;
}, {
  message: "Department is required for this role",
  path: ["departmentId"],
});

type InvitationFormData = z.infer<typeof invitationValidationSchema>;

const EnhancedInvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefilledData = {},
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Enhanced form with real-time validation
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isValid, isValidating },
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationValidationSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      email: prefilledData.email || '',
      role: prefilledData.role || 'STAFF',
      departmentId: prefilledData.departmentId || '',
      propertyId: prefilledData.propertyId || '',
    },
  });

  const watchedRole = watch('role');

  // Load departments with enhanced feedback
  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await departmentService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
      toastService.error('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Enhanced form submission
  const onSubmit = async (data: InvitationFormData) => {
    setLoading(true);
    const loadingToast = toastService.loading('Sending invitation...');

    try {
      await invitationService.createInvitation(data);
      
      toastService.dismiss(loadingToast);
      toastService.success(`Invitation sent to ${data.email}`);
      
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create invitation:', error);
      toastService.dismiss(loadingToast);
      toastService.actions.operationFailed(
        'send invitation',
        error.response?.data?.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-charcoal">
              Send Invitation
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field with Real-time Validation */}
            <FormField
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              required
              register={register('email')}
              error={errors.email}
              success={!!watch('email') && !errors.email}
              validating={isValidating}
              icon="📧"
            />

            {/* Role Selection */}
            <FormField
              label="Role"
              type="select"
              required
              register={register('role')}
              error={errors.role}
            >
              <option value="STAFF">Staff</option>
              <option value="DEPARTMENT_ADMIN">Department Admin</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="ORGANIZATION_ADMIN">Organization Admin</option>
              <option value="ORGANIZATION_OWNER">Organization Owner</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
            </FormField>

            {/* Department Selection with Loading State */}
            {['STAFF', 'DEPARTMENT_ADMIN'].includes(watchedRole) && (
              <div>
                {loadingDepartments ? (
                  <SkeletonCard showAvatar={false} rows={1} />
                ) : (
                  <FormField
                    label="Department"
                    type="select"
                    required
                    register={register('departmentId')}
                    error={errors.departmentId}
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </FormField>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="submit"
                className={`btn btn-primary flex-1 ${
                  !isValid || loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Send Invitation'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
```

### Key Improvements Made:

#### 1. Real-time Form Validation
- **Before**: Manual validation on submit only
- **After**: Zod schema with react-hook-form, real-time feedback
- **Benefit**: Users see validation errors immediately as they type

#### 2. Enhanced User Feedback
- **Before**: Basic `toast.error()` calls
- **After**: Centralized `toastService` with action-specific methods
- **Benefit**: Consistent, contextual feedback messages

#### 3. Loading State Management
- **Before**: Generic loading state
- **After**: Skeleton loaders for department loading, progress indicators
- **Benefit**: Better perceived performance and user understanding

#### 4. Form State Management
- **Before**: Manual state management with `useState`
- **After**: react-hook-form with automatic validation and state
- **Benefit**: Less boilerplate, better performance, built-in validation

#### 5. Visual Feedback
- **Before**: No visual indicators for field validity
- **After**: Success/error icons, validation states, button states
- **Benefit**: Clear visual feedback for all user interactions

### Implementation Pattern for Other Modals:

1. **Create validation schema** using Zod
2. **Replace useState with useForm** for form state
3. **Replace manual inputs with FormField** components
4. **Update error handling** to use toastService
5. **Add skeleton loaders** for loading states
6. **Implement visual feedback** for all user actions

### Benefits to User Experience:

- **Faster completion**: Real-time validation prevents submission errors
- **Better feedback**: Clear, consistent messages for all actions
- **Improved performance**: Skeleton loaders improve perceived speed
- **Visual clarity**: Success/error states make form status obvious
- **Consistent experience**: Same patterns across all forms

### Migration Checklist for Existing Modals:

- [ ] Add validation schema with Zod
- [ ] Convert to react-hook-form
- [ ] Replace manual inputs with FormField components
- [ ] Update error handling to use toastService
- [ ] Add skeleton loaders for async content
- [ ] Implement visual feedback indicators
- [ ] Test real-time validation
- [ ] Verify toast notifications
- [ ] Check mobile responsiveness

This pattern can be applied to all existing modals in the system for consistent UX improvements.