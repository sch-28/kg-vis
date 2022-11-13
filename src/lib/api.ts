import type { Property, URI } from "./types";

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

export async function fetch_property(subject: URI, property: URI):Promise<Property> {
	const result = await SPARQL_query(
		`
		PREFIX wdt: <http://www.wikidata.org/prop/direct/>
		PREFIX wd: <http://www.wikidata.org/entity/>
		SELECT DISTINCT ?propLabel (COUNT(?outObject) AS ?outCount) (COUNT(?inObject) AS ?inCount)    WHERE {
		{
			SELECT DISTINCT ?outObject WHERE {
			<${subject}> <${property}> ?outObject.
			}
			LIMIT 101
		}
		UNION
		{
			SELECT DISTINCT ?inObject WHERE {
			?inObject <${property}> <${subject}>.
			}
			LIMIT 101
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

export async function fetch_properties(subject: URI) {
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
	for (let i = 0; i < result.length; i += 5) {
		const properties = result.slice(i, i + 5).map((c) => c.property.value);

		const requests = [];
		properties.forEach((prop) => requests.push(fetch_property(subject, prop)));
		results.push(...(await Promise.all(requests)) as Property[]);
	}

	return results;
}

async function timeout(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
