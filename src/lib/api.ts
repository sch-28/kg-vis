export interface Triple {
	s: Node;
	p: Node;
	o: Node;
}

export interface Node {
	// termType: string;
	type: "literal" | "uri";
	value: string;
	label: string;
}

const endpoint = "http://query.wikidata.org/sparql";

async function SPARQL_query(body: string) {
	/* const result = await fetch(endpoint, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: `query=${body}`,
		mode: "no-cors",
	}); */
	const content = `?query=${encodeURIComponent(body)}`;
	const result = await fetch(endpoint + content, {
		method: "GET",
		headers: {
			Accept: "application/sparql-results+json",
		},
	});
	const json = await result.json();

	const triples = [];
	for (let binding of json.results.bindings) {
		triples.push(binding);
	}

	return triples;
}

export async function fetch_data(uri: string, property: string) {
	const result = await SPARQL_query(
		`PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?o ?propLabel ?oLabel ?label WHERE {
			{
			  ?o <${property}> <${uri}> .
			} UNION{
				<${uri}> <${property}> ?o
			}
			SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
			?prop wikibase:directClaim <${property}> .
			<${uri}> rdfs:label ?label .
			FILTER (lang(?label) = 'en')
			}`
	);

	return result.map((c) => {
		const data = {
			s: { value: uri, type: "uri", label: c.label.value },
			p: { value: property, type: "uri", label: c.propLabel.value },
			o: { value: c.o.value, type: c.o.type, label: c.oLabel.value },
		};
		return data;
	});
}

export async function fetch_properties(uri: string) {
	const result = await SPARQL_query(
		// removed ?o for now, it has yet to be implemented.
		// Alternatively keeping it like this will increase fetch time.
		`
		PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?p ?o ?propLabel ?oLabel ?label WHERE {
			{
			  ?o ?p <${uri}> .
			} UNION{
				<${uri}> ?p ?o
			}
			SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
			?prop wikibase:directClaim ?p .
			<${uri}> rdfs:label ?label .
			FILTER (lang(?label) = 'en')
			}`
	);
	return result.map((c: any) => {
		const data = {
			s: { value: uri, type: "uri", label: c.label.value },
			p: { value: c.p.value, type: c.p.type, label: c.propLabel.value },
			o: { value: c.o.value, type: c.o.type, label: c.oLabel.value },
		};
		return data;
	});
}
