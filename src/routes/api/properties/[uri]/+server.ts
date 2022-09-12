import { fetch_data, fetch_properties } from '$lib/api/rdf';
import type { RequestHandler, RequestEvent } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }: RequestEvent) => {
	if (!params.uri) return new Response('');

	const result = await fetch_properties(params.uri);
	return new Response(JSON.stringify(result));
};
