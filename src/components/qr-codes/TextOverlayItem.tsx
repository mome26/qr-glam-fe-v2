import React from 'react';
import { Trash2 } from 'lucide-react';
import type { TemplateText } from '../../types';

interface TextOverlayItemProps {
  text: TemplateText;
  onChange: (updated: TemplateText) => void;
  onDelete: () => void;
}

export const TextOverlayItem: React.FC<TextOverlayItemProps> = ({
  text,
  onChange,
  onDelete,
}) => {
  type EditableField = Exclude<keyof TemplateText, 'id'>;

  const handleChange = (field: EditableField, value: string | number) => {
    onChange({ ...text, [field]: value });
  };

  return (
    <div className="bg-accent/50 p-4 rounded-lg border border-border flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs font-medium text-muted uppercase tracking-wider">
          Text Content
        </label>
        <input
          type="text"
          value={text.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="e.g. VIP AREA"
          maxLength={200}
          className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-white"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Size
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={text.size}
            onChange={(e) => handleChange('size', Number(e.target.value))}
            className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            X
          </label>
          <input
            type="number"
            min={0}
            max={2000}
            value={text.positionX}
            onChange={(e) => handleChange('positionX', Number(e.target.value))}
            className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Y
          </label>
          <input
            type="number"
            min={0}
            max={2000}
            value={text.positionY}
            onChange={(e) => handleChange('positionY', Number(e.target.value))}
            className="w-full px-3 py-1.5 border border-border rounded-md text-sm bg-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onDelete}
          className="text-xs text-error hover:text-error/80 flex items-center gap-1 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove Text
        </button>
      </div>
    </div>
  );
};
