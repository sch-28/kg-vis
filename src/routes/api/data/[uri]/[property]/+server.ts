import { fetch_data } from '$lib/api/rdf';
import type { RequestHandler, RequestEvent } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }: RequestEvent) => {
	if (!params.uri || !params.property) return new Response('');

	const result = await fetch_data(params.uri, params.property);

	return new Response(JSON.stringify(result));
};
