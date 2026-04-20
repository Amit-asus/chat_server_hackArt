import { useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateRoom } from '../../hooks/useRooms';

const schema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, - and _ only'),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ open, onClose }: Props) {
  const createRoom = useCreateRoom();
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: 'PUBLIC' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await createRoom.mutateAsync(data);
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Create Room</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room name</label>
            <input
              {...register('name')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="e.g. design-team"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              {...register('description')}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="What's this room for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input {...register('visibility')} type="radio" value="PUBLIC" className="accent-indigo-600" />
                <span>Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input {...register('visibility')} type="radio" value="PRIVATE" className="accent-indigo-600" />
                <span>Private</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-xl transition text-sm"
          >
            {isSubmitting ? 'Creating...' : 'Create room'}
          </button>
        </form>
      </div>
    </div>
  );
}
