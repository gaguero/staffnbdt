import React, { useState } from 'react';
import { useRoomTypes, useCreateRoomType, useUpdateRoomType, useDeleteRoomType } from '../../hooks/useHotel';

const RoomTypesPage: React.FC = () => {
  const { data: roomTypes = [] } = useRoomTypes();
  const createRT = useCreateRoomType();
  const updateRT = useUpdateRoomType();
  const deleteRT = useDeleteRoomType();

  const [form, setForm] = useState<any>({
    code: '',
    name: '',
    description: '',
    baseRate: 0,
    maxCapacity: 2,
    amenities: [],
    isActive: true,
  });
  const [amenities, setAmenities] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRT.mutateAsync({ ...form, amenities: amenities.split(',').map(s => s.trim()).filter(Boolean) });
    setForm({ code: '', name: '', description: '', baseRate: 0, maxCapacity: 2, amenities: [], isActive: true });
    setAmenities('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Room Types</h1>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <input className="border p-2 rounded md:col-span-1" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
        <input className="border p-2 rounded md:col-span-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="border p-2 rounded md:col-span-1" type="number" step="0.01" placeholder="Base Rate" value={form.baseRate ?? 0} onChange={e => setForm({ ...form, baseRate: Number(e.target.value) })} />
        <input className="border p-2 rounded md:col-span-1" type="number" placeholder="Capacity" value={form.maxCapacity ?? 2} onChange={e => setForm({ ...form, maxCapacity: Number(e.target.value) })} />
        <input className="border p-2 rounded md:col-span-6" placeholder="Amenities (comma-separated)" value={amenities} onChange={e => setAmenities(e.target.value)} />
        <textarea className="border p-2 rounded md:col-span-6" placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div className="md:col-span-6">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add Room Type</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Code</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Base Rate</th>
              <th className="text-left p-2">Capacity</th>
              <th className="text-left p-2">Active</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((rt: any) => (
              <tr key={rt.id} className="border-t">
                <td className="p-2">{rt.code || '-'}</td>
                <td className="p-2">{rt.name}</td>
                <td className="p-2">${Number(rt.baseRate ?? 0).toFixed(2)}</td>
                <td className="p-2">{rt.maxCapacity ?? 2}</td>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={rt.isActive ?? true}
                    onChange={() => updateRT.mutate({ id: rt.id, input: { isActive: !(rt.isActive ?? true) } })}
                  />
                </td>
                <td className="p-2">
                  <button className="text-blue-600 mr-3" onClick={() => {
                    const name = prompt('New name', rt.name);
                    if (name) updateRT.mutate({ id: rt.id, input: { name } });
                  }}>Edit</button>
                  <button className="text-red-600" onClick={() => {
                    if (confirm('Delete room type?')) deleteRT.mutate(rt.id);
                  }}>Delete</button>
                </td>
              </tr>
            ))}
            {roomTypes.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={6}>No room types yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomTypesPage;


