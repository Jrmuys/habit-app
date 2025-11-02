'use client';

import { useRouter } from 'next/navigation';
import HabitCreateForm from '@/components/HabitCreateForm';

export default function CreateHabitPage() {
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
        <HabitCreateForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
        />
    );
}
