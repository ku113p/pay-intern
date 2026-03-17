import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Perspective } from './PerspectiveToggle';

export function StickyMobileCTA({ perspective }: { perspective: Perspective }) {
  const { t } = useTranslation('landing');

  const btnClass =
    perspective === 'company'
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-green-600 hover:bg-green-700';

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 p-3">
      <Link
        to="/login"
        className={`block w-full ${btnClass} text-white text-center py-3 rounded-lg text-sm font-semibold shadow-lg transition`}
      >
        {t(`stickyCta.${perspective}`)}
      </Link>
    </div>
  );
}
