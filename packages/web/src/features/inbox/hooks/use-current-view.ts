import { useParams } from 'react-router';
import { DEFAULT_VIEW, findView } from '../views';

/** The view in the URL, or the default one when the slug is missing or unknown. */
export const useCurrentView = () => findView(useParams().view)?.slug ?? DEFAULT_VIEW;
