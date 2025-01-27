import type { PageLoad } from './$types';

export const load: PageLoad = ({ params: { id } }) => {
	return { id: parseInt(id) };
};
