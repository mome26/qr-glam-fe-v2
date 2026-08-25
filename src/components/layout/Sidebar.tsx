import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/use-auth';
import { LogOut, ChevronUp, ChevronDown, User, Settings, ShieldCheck, ChevronLeft, ChevronRight, HardDrive, CalendarDays, Image } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = () => {
    onClose();
  };

  const toggleCollapse = () => {
    onToggleCollapse();
  };

  return (
    <aside
      role="complementary"
      className={`bg-white border-r border-border h-screen flex flex-col p-2 fixed left-0 top-0 overflow-hidden z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      } w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors mb-4 cursor-default">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-info rounded-md flex items-center justify-center text-white font-bold">QG</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate max-w-[120px]">QR Glam</span>
              <span className="text-xs text-muted">{user?.role || 'User'}</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-info rounded-md flex items-center justify-center text-white font-bold mx-auto">QG</div>
        )}
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggleCollapse}
          className="p-1 rounded hover:bg-accent transition-colors hidden lg:block"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-muted" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-muted" />
          )}
        </button>
      </div>

      {/* Sidebar Content */}
      <nav className="flex-1 space-y-4 overflow-y-auto mt-4 px-1">
        {/* Main Section */}
        <div>
          {!isCollapsed && (
            <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Main</div>
          )}
          <div className="space-y-1">
            <NavLink
              to="/"
              onClick={handleNavClick}
              title="Dashboard"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-info text-white shadow-lg shadow-info/20' : 'text-muted hover:bg-accent hover:text-info'} ${isCollapsed ? 'justify-center lg:justify-center' : ''}`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink
              to="/events"
              onClick={handleNavClick}
              title="Events"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-info text-white shadow-lg shadow-info/20' : 'text-muted hover:bg-accent hover:text-info'} ${isCollapsed ? 'justify-center lg:justify-center' : ''}`}
            >
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Events</span>}
            </NavLink>
            <NavLink
              to="/media"
              onClick={handleNavClick}
              title="Media"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-info text-white shadow-lg shadow-info/20' : 'text-muted hover:bg-accent hover:text-info'} ${isCollapsed ? 'justify-center lg:justify-center' : ''}`}
            >
              <Image className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Media</span>}
            </NavLink>
          </div>
        </div>

        {/* Administration Section */}
        <div>
          {!isCollapsed && (
            <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Administration</div>
          )}
          <div className="space-y-1">
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/team"
                onClick={handleNavClick}
                title="Team Members"
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-info text-white shadow-lg shadow-info/20' : 'text-muted hover:bg-accent hover:text-info'} ${isCollapsed ? 'justify-center lg:justify-center' : ''}`}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>Team Members</span>}
              </NavLink>
            )}
            <NavLink
              to="/settings"
              onClick={handleNavClick}
              title="Account Settings"
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-info text-white shadow-lg shadow-info/20' : 'text-muted hover:bg-accent hover:text-info'} ${isCollapsed ? 'justify-center lg:justify-center' : ''}`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Account Settings</span>}
            </NavLink>
            {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
              <NavLink
                to="/media-admin"
                onClick={handleNavClick}
                title="Media Provider"
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-info text-white shadow-lg shadow-info/20' : 'text-muted hover:bg-accent hover:text-info'} ${isCollapsed ? 'justify-center lg:justify-center' : ''}`}
              >
                <HardDrive className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>Media Provider</span>}
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer - User Menu */}
      <div ref={userMenuRef} className="mt-auto border-t border-border pt-2 pb-2">
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`w-full flex items-center p-2 rounded-lg transition-all ${isUserMenuOpen ? 'bg-accent' : 'hover:bg-accent'} ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}
          title={isCollapsed ? (user?.name || 'User') : undefined}
        >
          <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? 'lg:gap-0' : ''}`}>
            <img
              src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=7C9070&color=fff`}
              alt="Avatar"
              className="w-8 h-8 rounded-full shadow-sm border border-white flex-shrink-0"
            />
            {!isCollapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-semibold truncate leading-none mb-1">{user?.name || 'User'}</span>
                <span className="text-[10px] text-muted truncate">{user?.email || ''}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (isUserMenuOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronUp className="w-4 h-4 text-muted" />)}
        </button>
      </div>

      {/* User menu dropdown rendered via portal to avoid overflow-hidden clipping */}
      {isUserMenuOpen && createPortal(
        <div
          className="fixed bottom-16 left-2 w-60 bg-white border border-border rounded-xl shadow-xl p-1 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ maxWidth: 'calc(100vw - 1rem)' }}
        >
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 p-3 text-sm font-medium text-error hover:bg-error/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>,
        document.body,
      )}
    </aside>
  );
};

export default Sidebar;
