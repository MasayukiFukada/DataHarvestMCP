"use client";

import { useState } from "react";
import { Site, UpdateLog } from "db";

type SiteWithLogs = Site & {
  logs: UpdateLog[];
};

interface SiteCardProps {
  site: SiteWithLogs;
  onUpdate: (formData: FormData) => void;
  onDelete: (formData: FormData) => void;
}

export default function SiteCard({ site, onUpdate, onDelete }: SiteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: site.title,
    url: site.url,
    instruction: site.instruction,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("id", String(site.id));
    onUpdate(fd);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      title: site.title,
      url: site.url,
      instruction: site.instruction,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Site</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Site Title</label>
              <input
                name="title"
                type="text"
                required
                defaultValue={formData.title}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <input
                name="url"
                type="url"
                required
                defaultValue={formData.url}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">AI Instruction</label>
              <textarea
                name="instruction"
                rows={3}
                defaultValue={formData.instruction}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-black"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{site.title}</h3>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
              {site.url}
            </a>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              Edit
            </button>
            <form action={onDelete}>
              <input type="hidden" name="id" value={site.id} />
              <button type="submit" className="text-red-500 hover:text-red-700 text-sm">Delete</button>
            </form>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instruction</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{site.instruction}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Latest Check</h4>
          {site.logs[0] ? (
            <div className={`p-3 rounded text-sm ${site.logs[0].hasChange ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex justify-between mb-1">
                <span className={`font-bold ${site.logs[0].hasChange ? 'text-yellow-800' : 'text-green-800'}`}>
                  {site.logs[0].hasChange ? 'Update Detected!' : 'No Changes'}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(site.logs[0].createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{site.logs[0].summary}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Never checked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}