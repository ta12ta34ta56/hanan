import { Icon } from '../Icon';
import { useThemeStore } from '../../stores/theme-store';

export type CustomerTab = 'home' | 'projects';

interface Props {
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
}

export function CustomerNav({ activeTab, onSelectTab }: Props) {
  const themeChoice = useThemeStore((s) => s.choice);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <header className="lp-nav" role="banner">
      <button
        className="lp-brand"
        onClick={() => onSelectTab('home')}
        title="Novelka Home"
        aria-label="Novelka Home"
      >
        <span className="lp-brand-mark">N</span>
        <span>Novelka</span>
      </button>

      <nav className="lp-links" aria-label="Main Navigation">
        <button
          className={activeTab === 'home' ? 'active' : ''}
          onClick={() => onSelectTab('home')}
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          Home
        </button>
        <button
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => onSelectTab('projects')}
          aria-current={activeTab === 'projects' ? 'page' : undefined}
        >
          Projects
        </button>
      </nav>

      <div className="lp-nav-right">
        <button
          className="lp-icon-btn"
          onClick={toggleTheme}
          title={
            themeChoice === 'light'
              ? 'Theme: light — click for dark'
              : 'Theme: dark — click for light'
          }
          aria-label={`Theme: ${themeChoice}. Click to switch to ${themeChoice === 'light' ? 'dark' : 'light'}.`}
        >
          <Icon name={themeChoice === 'light' ? 'sun' : 'moon'} size={16} />
        </button>
      </div>
    </header>
  );
}
