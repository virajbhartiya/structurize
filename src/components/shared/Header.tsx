import { FaGithub } from 'react-icons/fa'
import { ModeToggle } from '@/components/ModeToggle'

const Header = () => (
  <header className="bg-[var(--background)] border-b border-[var(--accent)] py-4 mb-8">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="font-thin text-[var(--accent)]">Structurize</h1>
      <nav>
        <ul className="flex space-x-4 items-center">
          <li>
            <ModeToggle />
          </li>
          <li>
            <a
              href="https://github.com/virajbhartiya/structurize"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline flex items-center"
            >
              <FaGithub className="mr-1" /> GitHub
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </header>
)

export default Header
