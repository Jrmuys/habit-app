'use client';

import { useRouter } from 'next/navigation';
import MilestoneCreateForm from '@/components/MilestoneCreateForm';

export default function CreateMilestonePage() {
    const router = useRouter();

    const handleSuccess = () => {
        // Navigate back to dashboard after successful creation
        router.push('/dashboard');
    };

    const handleCancel = () => {
        // Navigate back to dashboard if user cancels
        router.back();
    };

    return (
        <MilestoneCreateForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}
