import { Triple, SimNode, SimLink } from "./types/rdf.types";

const endpoint = " https://skynet.coypu.org/freebase/";

async function SPARQL_query(body: string) {
	const result = await fetch(endpoint, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: `query=${body}`
	});

	const json = await result.json();

	const triples: Triple[] = [];
	for (let binding of json.results.bindings) {
		triples.push({ s: binding.s, p: binding.p, o: binding.o } as Triple);
	}


	return triples;
}

export function parse_data(data: Triple[], origin_uri: string) {
	const nodes: SimNode[] = [];
	const links: SimLink[] = [];
	for (let triple of data) {
		const origin = new SimNode(origin_uri);
		const source = new SimNode(triple.o.value);
		const target = new SimNode(triple.s.value);
		const link = new SimLink(triple.p.value, origin, source);
		const link2 = new SimLink("something", origin, source);

		nodes.push(source, target);
		links.push(link);
	}

	return [nodes, links] as const;
}

export async function fetch_data(uri: string, property: string) {
	const result = await SPARQL_query(
		`SELECT DISTINCT ?s ?p ?o WHERE 
		{{
			?s 		<${property}> 	<${uri}> .
					
		}UNION{
			<${uri}>		<${property}> 	 ?s .
		}}`
	);

	return result.map((c) => {
		/* const data: rdf_data = {
			source: { value: uri },
			property: { value: property },
			target: c.s,
			target_property: c.p,
			target_target: c.o
		}; */
		const data: Triple = {
			s: { value: uri, type: "uri" },
			p: { value: property, type: "uri" },
			o: c.s
		};
		return data;
	});
}

export async function fetch_properties(uri: string) {
	const result = await SPARQL_query(
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
	return result.map((c) => {
		/* const data: rdf_data = {
			source: { value: uri },
			property: { value: property },
			target: c.s,
			target_property: c.p,
			target_target: c.o
		}; */
		const data: Triple = {
			s: { value: uri, type: "uri" },
			p: c.p,
			o: { value: "TODO", type: "literal" }
		};
		return data;
	});
}
