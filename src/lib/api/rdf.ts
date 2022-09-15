import { SparqlEndpointFetcher } from 'fetch-sparql-endpoint';
import { type Triple, SimNode, SimLink, type rdf_data } from './rdf.types';

const fetcher = new SparqlEndpointFetcher();

export function parse_data(data: Triple[], origin_uri: string) {
	const nodes: SimNode[] = [];
	const links: SimLink[] = [];
	for (let triple of data) {
		const origin = new SimNode(origin_uri);
		const source = new SimNode(triple.o.value);
		const target = new SimNode(triple.s.value);
		const link = new SimLink(triple.p.value, origin, source);
		const link2 = new SimLink('something', origin, source);

		nodes.push(source, target);
		links.push(link);
	}

	return [nodes, links] as const;
}

export async function fetch_data(uri: string, property: string) {
	const stream = await fetcher.fetchBindings(
		'https://dbpedia.org/sparql',
		`SELECT DISTINCT ?s ?p ?o WHERE 
		{{
			?s 		<${property}> 	<${uri}> .
					
		}UNION{
			<${uri}>		<${property}> 	 ?s .
		}}`
	);
	const chunks: Triple[] = [];
	await new Promise((resolve, reject) => {
		stream.on('data', (chunk) => chunks.push(chunk));
		stream.on('error', (err) => reject(err));
		stream.on('end', () => resolve(chunks));
	});

	return chunks.map((c) => {
		/* const data: rdf_data = {
			source: { value: uri },
			property: { value: property },
			target: c.s,
			target_property: c.p,
			target_target: c.o
		}; */
		const data: Triple = {
			s: { value: uri },
			p: { value: property },
			o: c.s
		};
		return data;
	});
}

export async function fetch_properties(uri: string) {
	console.log(`SELECT DISTINCT ?s ?p WHERE { ?s ?p <${uri}> .}GROUP BY ?p`);
	const stream = await fetcher.fetchBindings(
		'https://dbpedia.org/sparql',
		// removed ?o for now, it has yet to be implemented.
		// Alternatively keeping it like this will increase fetch time.
		`SELECT DISTINCT ?p WHERE {
			{
			  ?o ?p <${uri}> .
			} UNION{
				<${uri}> ?p ?o
			}
			}GROUP BY ?p`
	);
	const properties: Triple[] = [];
	return new Promise((resolve, reject) => {
		stream.on('data', (chunk) =>
			properties.push({ s: { value: uri }, p: chunk.p, o: { value: 'test' } })
		);
		stream.on('error', (err) => reject(err));
		stream.on('end', () => resolve(properties));
	});
}
