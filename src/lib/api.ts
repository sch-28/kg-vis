import type { Property, URI } from "./types";

const RATE_LIMIT = 5;
const SIZE_LIMIT = 100;

export interface Triple {
	subject: Node;
	property: Node;
	object: Node;
}

export interface Node {
	// termType: string;
	type: "literal" | "uri";
	value: string;
}

const endpoint = "https://query.wikidata.org/sparql";

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

export async function fetch_data(subject: URI, property: URI, nodes: URI[]) {
	const result = await SPARQL_query(
		`PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?object  WHERE {
			{
			  ?object <${property}> <${subject}> .
			} UNION{
				<${subject}> <${property}> ?object
			}
			}`
	);

	const results: {
		uri: URI;
		label: string;
		relations: { subject: Node; property: Node; object: Node; propLabel: Node }[];
	}[] = [];

	for (let i = 0; i < result.length; i += Math.floor(RATE_LIMIT / 2)) {
		const new_nodes = result.slice(i, i + Math.floor(RATE_LIMIT / 2)).map((c) => c.object.value);

		const requests: { uri: URI; label: Promise<string>; relations: any }[] = [];
		new_nodes.forEach((node) =>
			requests.push({
				uri: node,
				label: fetch_label(node),
				relations: fetch_relations(node, [...nodes, ...new_nodes]),
			})
		);
		// results.push(...(await Promise.all(requests.map(r => [r.label, r.relations]))));
		for (let i = 0; i < requests.length; i++) {
			const request = requests[i];
			const r = await Promise.all([request.label, request.relations]);
			results.push({ uri: request.uri, label: r[0], relations: r[1] });
		}
	}

	return results;
}

export async function fetch_label(subject: URI) {
	const result = await SPARQL_query(
		`
		PREFIX wikibase: <http://wikiba.se/ontology#>
		SELECT DISTINCT ?subjectLabel WHERE {
          VALUES ?subject {
    		<${subject}>
  			}

 		
    	SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }.	
		}
			`
	);
	if (result.length > 0) {
		return result[0].subjectLabel.value;
	}

	throw new Error("Unable to fetch label: " + result);
}

export async function fetch_relations(subject: URI, other_nodes: URI[]) {
	let relations = ``;

	for (let i = 0; i < other_nodes.length; i++) {
		const node = other_nodes[i];

		relations += `
		{
			VALUES ?object {
				<${node}>
			}
			VALUES ?subject {
				<${subject}>
			}
			{	
				?object ?property ?subject .
			} UNION{
				?subject ?property ?object .
			}
		}
			`;

		if (i + 1 < other_nodes.length) {
			relations += "UNION";
		}
	}

	const result = await SPARQL_query(
		`SELECT DISTINCT ?object ?property ?propLabel ?subject WHERE
		{
			${relations}
			?claim wikibase:directClaim ?property.
			?prop wikibase:directClaim ?property .
			SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
		}`
	);

	return result as { subject: Node; property: Node; object: Node; propLabel: Node }[];
}

export async function fetch_property(subject: URI, property: URI): Promise<Property> {
	const result = await SPARQL_query(
		`
		PREFIX wdt: <http://www.wikidata.org/prop/direct/>
		PREFIX wd: <http://www.wikidata.org/entity/>
		SELECT DISTINCT ?propLabel (COUNT(?outObject) AS ?outCount) (COUNT(?inObject) AS ?inCount)    WHERE {
		{
			SELECT DISTINCT ?outObject WHERE {
			<${subject}> <${property}> ?outObject.
			}
			LIMIT ${SIZE_LIMIT}
		}
		UNION
		{
			SELECT DISTINCT ?inObject WHERE {
			?inObject <${property}> <${subject}>.
			}
			LIMIT ${SIZE_LIMIT}
		}
		OPTIONAL {
			?prop wikibase:directClaim <${property}> .
			}
		SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
		} GROUP BY ?propLabel `
	);

	if (result.length > 0) {
		const res = result[0];
		return {
			label: res.propLabel?.value,
			uri: property,
			out_count: +res.outCount.value,
			in_count: +res.inCount.value,
		};
	}

	throw new Error("Unable to fetch Property: " + result);
}

export async function fetch_properties(subject: URI, progress_function?: Function) {
	const result = await SPARQL_query(
		`
		PREFIX wikibase: <http://wikiba.se/ontology#>
		PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		SELECT DISTINCT ?property  WHERE {
			{
			  ?o ?property <${subject}> .
			} UNION{
				<${subject}> ?property ?o
			}
			?claim wikibase:directClaim ?property.
			}`
	);

	const results: Property[] = [];
	for (let i = 0; i < result.length; i += RATE_LIMIT) {
		const properties = result.slice(i, i + RATE_LIMIT).map((c) => c.property.value);

		const requests = [];
		properties.forEach((prop) => requests.push(fetch_property(subject, prop)));
		results.push(...((await Promise.all(requests)) as Property[]));
		progress_function(Math.floor((i / result.length) * 100));
	}

	return results;
}

async function timeout(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
