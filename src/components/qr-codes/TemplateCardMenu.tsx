import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react';
import type { QrTemplate } from '../../types';
import { useNavigate } from 'react-router-dom';

interface TemplateCardMenuProps {
  template: QrTemplate;
  slugWithId: string | undefined;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string, isDefault: boolean) => void;
  isDuplicating?: boolean;
  isDeleting?: boolean;
}

export default function TemplateCardMenu({
  template,
  slugWithId,
  onDuplicate,
  onDelete,
  isDuplicating = false,
  isDeleting = false,
}: TemplateCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    navigate(`/events/${slugWithId}/templates/${template.id}/edit`);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onDuplicate(template.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onDelete(template.id, template.isDefault);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-1 text-muted hover:text-foreground hover:bg-black/5 rounded transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Template actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-border py-1 z-[60] animate-in fade-in zoom-in duration-100 origin-top-right text-sm"
          role="menu"
        >
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition-colors text-foreground"
            role="menuitem"
          >
            <Pencil className="w-4 h-4 text-info" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            <Copy className="w-4 h-4 text-success" />
            <span>Duplicate</span>
          </button>
          <div className="h-px bg-border my-1" />
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition-colors text-error disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
