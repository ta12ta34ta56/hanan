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
    <header className="nk-nav" role="banner">
      <button
        className="nk-nav-brand"
        type="button"
        onClick={() => onSelectTab('home')}
        title="Novelka Home"
        aria-label="Novelka Home"
      >
        Novelka
      </button>

      <nav className="nk-nav-links" aria-label="Main">
        <button
          type="button"
          className={activeTab === 'home' ? 'on' : ''}
          onClick={() => onSelectTab('home')}
        >
          Home
        </button>
        <button
          type="button"
          className={activeTab === 'projects' ? 'on' : ''}
          onClick={() => onSelectTab('projects')}
        >
          Projects
        </button>
      </nav>

      <button
        className="nk-nav-theme"
        type="button"
        onClick={toggleTheme}
        title={
          themeChoice === 'light'
            ? 'Theme: light — click for dark'
            : 'Theme: dark — click for light'
        }
        aria-label={`Theme: ${themeChoice}. Click to switch to ${themeChoice === 'light' ? 'dark' : 'light'}.`}
      >
        <Icon name={themeChoice === 'light' ? 'sun' : 'moon'} size={15} />
      </button>
    </header>
  );
}
