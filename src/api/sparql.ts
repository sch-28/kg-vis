import { Settings } from '../settings';
import { get } from 'svelte/store';
import isUrl from 'is-url';
import { show_loading_toast } from '../util';
import type { Node, Property, URI } from './graph';

export interface BindingContent {
	type: 'literal' | 'uri';
	value: URI;
	datatype?: URI;
	'xml:lang'?: string;
}

interface Binding {
	[key: string]: BindingContent;
}

type Bindings = Binding[];

interface PREFIXES {
	[key: string]: string;
}

const PREFIXES: PREFIXES = {
	rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
	rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
	owl: 'http://www.w3.org/2002/07/owl#',
	xsd: 'http://www.w3.org/2001/XMLSchema#',
	skos: 'http://www.w3.org/2004/02/skos/core#',
	dcterms: 'http://purl.org/dc/terms/',
	foaf: 'http://xmlns.com/foaf/0.1/',
	schema: 'http://schema.org/',
	prov: 'http://www.w3.org/ns/prov#',
	dc: 'http://purl.org/dc/elements/1.1/',
	dct: 'http://purl.org/dc/terms/',
	geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
	geosparql: 'http://www.opengis.net/ont/geosparql#',
	gn: 'http://www.geonames.org/ontology#',
	gndo: 'http://d-nb.info/standards/elementset/gnd#',
	wd: 'http://www.wikidata.org/entity/',
	wdt: 'http://www.wikidata.org/prop/direct/',
	wikibase: 'http://wikiba.se/ontology#',
	bd: 'http://www.bigdata.com/rdf#',
	bif: 'http://www.openlinksw.com/schemas/bif#',
	wdno: 'http://www.wikidata.org/prop/novalue/',
	wdref: 'http://www.wikidata.org/reference/',
	wdv: 'http://www.wikidata.org/value/',
	dbpedia: 'http://dbpedia.org/resource/',
	dbprop: 'http://dbpedia.org/property/',
	dbowl: 'http://dbpedia.org/ontology/',
	dbcat: 'http://dbpedia.org/resource/Category:',
	db: 'http://dbpedia.org/',
	dbp: 'http://dbpedia.org/property/'
};

class SPARQL_Queries {
	private last_fetch: number = 0;
	private queue: string[] = [];
	private last_queue: number = 0;
	private query_counter: number = 0;

	public get rate_limit() {
		return +get(Settings).rate_limit ?? 10;
	}

	public get query_count() {
		return this.query_counter;
	}

	public get size_limit() {
		return +get(Settings).size_limit ?? 100;
	}

	public get endpoint() {
		const endpoint = get(Settings).endpoint_url;
		if (!isUrl(endpoint) || endpoint.length === 0) {
			console.error('Invalid endpoint URL');
		}
		return endpoint;
	}

	public get endpoint_type() {
		return get(Settings).endpoint_type ?? 'wikidata';
	}

	public get endpoint_lang() {
		return get(Settings).endpoint_lang ?? 'en';
	}

	public shorten_uri(uri: URI) {
		let shortened = false;
		for (const prefix in PREFIXES) {
			if (uri.includes(PREFIXES[prefix])) {
				const code = uri.split(PREFIXES[prefix])[1];
				if (code.length > 0) {
					uri = uri.replace(PREFIXES[prefix] + code, prefix + ':' + code);
					shortened = true;
				}
			}
		}
		if (!shortened) {
			uri = '<' + uri + '>';
		}

		return uri;
	}

	public get prefixes() {
		let prefix = '';
		for (const key in PREFIXES) {
			prefix += `PREFIX ${key}: <${PREFIXES[key]}> `;
		}
		return prefix;
	}

	public async query<T extends Binding>(
		body?: string,
		custom_endpoint?: string
	): Promise<Partial<T>[]> {
		// queue requests if rate limit is reached
		const now = Date.now();
		const diff = now - this.last_fetch;
		if (diff < this.rate_limit && body) {
			this.queue.push(body);
			const timeout = Math.max(this.last_queue, this.last_fetch) + this.rate_limit - now;
			this.last_queue = timeout + now;

			return new Promise<Partial<T>[]>((res) =>
				setTimeout(async () => {
					res(await this.query<T>());
				}, timeout)
			);
		}

		this.last_fetch = now;

		if (this.queue.length > 0 && !body) {
			body = this.queue.shift();
		}

		if (!body) return [];

		const urlencoded = new URLSearchParams();
		urlencoded.append('query', this.prefixes + body);

		try {
			const result = await fetch(custom_endpoint || this.endpoint, {
				method: 'POST',

				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/sparql-results+json'
				},
				body: urlencoded
			});

			if (result.status != 200) {
				const error_message = await result.text();
				throw new Error(`SPARQL query: ${error_message}`);
			}

			const json = await result.json();

			const bindings: T[] = [];
			for (const binding of json.results.bindings) {
				bindings.push(binding);
			}
			this.query_counter++;
			return bindings;
		} catch (e) {
			console.error(e);
			if (e instanceof Error) show_loading_toast(Promise.reject(), 'query');
			return [];
		}
	}

	// used for smart-search. Allows free-text search
	public async search(search_text: URI) {
		let result: {
			item?: BindingContent;
			itemLabel?: BindingContent;
			typeLabel?: BindingContent;
		}[] = [];

		if (this.endpoint_type == 'wikidata')
			result = await SPARQL.query<{
				item: BindingContent;
				itemLabel: BindingContent;
				typeLabel: BindingContent;
			}>(
				`	SELECT ?item ?itemLabel ?typeLabel WHERE {
				SERVICE wikibase:mwapi {
				bd:serviceParam wikibase:endpoint 'www.wikidata.org';
								wikibase:api 'EntitySearch';
								mwapi:search '${search_text}';
								mwapi:language '${this.endpoint_lang}'.
				?item wikibase:apiOutputItem mwapi:item.
				?num wikibase:apiOrdinal true.

				}
				
				OPTIONAL{
					?item rdfs:label ?itemLabel .
					FILTER (lang(?itemLabel) = '${this.endpoint_lang}')
				}
				OPTIONAL{
					?item (wdt:P279|wdt:P31) ?type .
					?type rdfs:label ?typeLabel .
					FILTER (lang(?typeLabel) = '${this.endpoint_lang}')  
				}
				} ORDER BY ASC(?num) LIMIT 5`,
				'https://query.wikidata.org/sparql'
			);
		else if (this.endpoint_type == 'dbpedia') {
			if (search_text.split(' ').length > 0 && search_text.split(' ').every((x) => x.length > 0)) {
				search_text = search_text
					.split(' ')
					.map((x) => `"${x}"`)
					.join(' AND ');
			}
			result = await SPARQL.query<{
				item: BindingContent;
				itemLabel: BindingContent;
				typeLabel: BindingContent;
			}>(
				`	SELECT DISTINCT ?item ?itemLabel ?typeLabel WHERE {
				?item rdfs:label ?itemLabel . 
				FILTER (lang(?itemLabel) = '${this.endpoint_lang}') . 
				?itemLabel bif:contains '${search_text}' . 
				?item dcterms:subject ?type 
				OPTIONAL{
					
					?type rdfs:label ?typeLabel .
					FILTER (lang(?typeLabel) = '${this.endpoint_lang}')  
				}
				
				}  LIMIT 5 `,
				'https://dbpedia.org/sparql'
			);
		}
		if (result.length === 0) {
			return [];
		}

		const entities = [];
		for (const item of result) {
			entities.push({
				uri: item.item?.value ?? '',
				label: item.itemLabel?.value ?? '',
				type: item.typeLabel?.value ?? ''
			});
		}

		return entities;
	}

	public async fetch_description(subject: URI) {
		const result = await this.query<{ description: BindingContent }>(`

		SELECT DISTINCT ?description WHERE {
			VALUES ?subject {
				${this.shorten_uri(subject)}
			}
			?subject schema:description ?description
			FILTER (lang(?description) = '${this.endpoint_lang}')
		} LIMIT 1`);

		return result[0]?.description?.value ?? '';
	}

	// used to fetch all related nodes for a given node and one of its property
	public async fetch_related_nodes(subject: URI, property: URI, notify?: boolean) {
		let resolve!: () => void;
		const promise = new Promise<void>((res) => (resolve = res));
		notify && show_loading_toast(promise, 'Related');

		const result = await this.query<{ object: BindingContent; objectLabel?: BindingContent }>(
			`
			SELECT DISTINCT ?object ?objectLabel ?objectDescription  WHERE {
				{
				  ?object ${this.shorten_uri(property)} ${this.shorten_uri(subject)} .
				} UNION{
					${this.shorten_uri(subject)} ${this.shorten_uri(property)} ?object
				}
				OPTIONAL {
					?object rdfs:label ?objectLabel 
					FILTER (lang(?objectLabel) = '${this.endpoint_lang}')
				}
				} LIMIT ${this.size_limit}`
		);
		resolve();

		const results = result
			.map((r) => ({
				uri: r.object?.value ?? '',
				type: r.object?.type ?? 'literal',
				label: r.objectLabel?.value ?? r.object?.value ?? '',
				datatype: r.object?.datatype ?? undefined,
				language: r.object?.['xml:lang'] ?? undefined
			}))
			.filter((r) => r.uri !== '');

		return results;
	}

	public async fetch_image(subject: URI) {
		if (!isUrl(subject)) return undefined;
		const result = await this.query<{
			image: BindingContent;
		}>(
			`
			SELECT DISTINCT ?image WHERE {
			  VALUES ?subject {
				${this.shorten_uri(subject)}
				  }
	
			?subject wdt:P18 ?image
			}
				`
		);
		if (result.length > 0) {
			return result[0].image?.value ?? undefined;
		}

		return undefined;
	}

	public async fetch_images(subjects: URI[]) {
		const result = await this.query<{
			image: BindingContent;
			subject: BindingContent;
		}>(
			`
			
			SELECT DISTINCT ?subject ?image WHERE {
			  VALUES ?subject {
				${subjects
					.filter((s) => isUrl(s))
					.map((s) => this.shorten_uri(s))
					.join('\n')}
				  }
	
			?subject wdt:P18 ?image
			
			}
				`
		);
		return result
			.map((r) => ({ image: r.image?.value, uri: r.subject?.value }))
			.filter((r) => r.image && r.uri) as { image: string; uri: string }[];
	}

	public async fetch_property_labels(properties: URI[]) {
		const result = await this.query<{
			property: BindingContent;
			propertyLabel: BindingContent;
		}>(
			`
			SELECT DISTINCT ?property ?propertyLabel  WHERE {
			  VALUES ?property {
				${properties
					.filter((p) => isUrl(p))
					.map((p) => this.shorten_uri(p))
					.join('\n')}
				  }		
				OPTIONAL{
				  ${
						this.endpoint_type === 'wikidata'
							? '?prop wikibase:directClaim ?property . ?prop rdfs:label ?propertyLabel  '
							: '?property rdf:type rdf:Property .  ?property rdfs:label ?propertyLabel '
					}
					FILTER (lang(?propertyLabel) = '${this.endpoint_lang}')
				}
			}
				`
		);
		if (result.length > 0) {
			return result.map((r) => {
				return {
					uri: r.property?.value ?? '',
					label: r.propertyLabel?.value ?? r.property?.value ?? ''
				};
			});
		}

		return properties.map((p) => ({ uri: p, label: p }));
	}

	public async fetch_labels(subjects: URI[]) {
		const result = await this.query<{
			subject: BindingContent;
			subjectLabel: BindingContent;
		}>(
			`
			SELECT DISTINCT ?subject ?subjectLabel  WHERE {
			  VALUES ?subject {
				${subjects
					.filter((s) => isUrl(s))
					.map((s) => this.shorten_uri(s))
					.join('\n')}
				  }		
				
				OPTIONAL{
					?subject rdfs:label ?subjectLabel
					FILTER (lang(?subjectLabel) = '${this.endpoint_lang}')
				  }
				  
			}
				`
		);
		if (result.length > 0) {
			return result.map((r) => {
				return {
					uri: r.subject?.value ?? '',
					label: r.subjectLabel?.value ?? r.subject?.value ?? ''
				};
			});
		}

		return subjects.map((s) => ({ uri: s, label: s }));
	}

	public async fetch_info(subject: URI) {
		const result = await this.query<{
			label: BindingContent;
			description: BindingContent;
			typeLabel: BindingContent;
		}>(
			`
			SELECT DISTINCT ?label ?description ?typeLabel WHERE {
			  VALUES ?subject {
				${this.shorten_uri(subject)}
				  }
	
			OPTIONAL {
			?subject rdfs:label ?label 
			FILTER (lang(?label) = '${this.endpoint_lang}')
			}
			OPTIONAL{
				?subject (wdt:P279|wdt:P31) ?type .
				?type rdfs:label ?typeLabel .
				FILTER (lang(?typeLabel) = '${this.endpoint_lang}')
			}
			OPTIONAL {
				?subject schema:description ?description
				FILTER (lang(?description) = '${this.endpoint_lang}')
			}
			
			}
				`
		);
		if (result.length > 0) {
			return {
				label: result[0].label?.value ?? subject,
				description: result[0].description?.value ?? '',
				type: result[0].typeLabel?.value ?? ''
			};
		}

		return { label: subject, description: '', type: '' };
	}
	// fetches relations between multiple nodes
	public async fetch_multiple_relations(
		subjects: BindingContent[],
		other_nodes: BindingContent[],
		notify: boolean = true
	) {
		let resolve!: () => void;

		const promise = new Promise<void>((res) => (resolve = res));
		notify && show_loading_toast(promise, 'Relations');

		const relations = (await this.fetch_relations(subjects, other_nodes)).map((r) => {
			const outgoing_property = r.dir.value === 'out';

			return {
				subject: outgoing_property ? r.subject : r.object,
				property: r.property,
				object: outgoing_property ? r.object : r.subject,
				property_label: r.property.value
			};
		});

		const infos = await this.fetch_property_labels(relations.map((r) => r.property.value));

		for (let i = 0; i < relations.length; i++) {
			const relation = relations[i];
			const info = infos.find((l) => l.uri === relation.property.value);
			if (info) {
				relation.property_label = info.label;
				/* relation.property_description = info.description; */
			}
		}

		resolve();
		return relations;
	}

	public async fetch_relations(subjects: BindingContent[], other_nodes: BindingContent[]) {
		let subjects_string = `VALUES ?subject {\n`;

		for (let i = 0; i < subjects.length; i++) {
			const node = subjects[i];
			if (isUrl(node.value)) subjects_string += `${this.shorten_uri(node.value)}\n`;
			else
				subjects_string += `"${node.value}"${
					node.datatype
						? '^^' + this.shorten_uri(node.datatype)
						: node['xml:lang']
						? '@' + node['xml:lang']
						: ''
				} \n`;
		}
		subjects_string += '}';

		let objects_string = `VALUES ?object {\n`;

		for (let i = 0; i < other_nodes.length; i++) {
			const node = other_nodes[i];
			if (isUrl(node.value)) objects_string += `${this.shorten_uri(node.value)}\n`;
			else
				objects_string += `"${node.value}"${
					node.datatype
						? '^^' + this.shorten_uri(node.datatype)
						: node['xml:lang']
						? '@' + node['xml:lang']
						: ''
				}\n`;
		}
		objects_string += '}';

		const result = await this.query<{
			subject: BindingContent;
			property: BindingContent;
			object: BindingContent;
			dir: BindingContent;
		}>(
			`
        SELECT DISTINCT ?object ?property ?subject ?dir WHERE
        {
            ${subjects_string}
            ${objects_string}
            {
                BIND("in" as ?dir) . ?object ?property ?subject .
            }
            UNION
            {	
                BIND("out" as ?dir) . ?subject ?property ?object . 
            }
            
        }`
		);

		return result.filter((r) => r.subject && r.object) as Required<typeof result[number]>[];
	}

	public async fetch_property_count(subject: URI, property: URI): Promise<Property> {
		const result = await this.query<{
			propLabel: BindingContent;
			outCount: BindingContent;
			inCount: BindingContent;
		}>(
			`
			
			SELECT DISTINCT ?propLabel (COUNT(?outObject) AS ?outCount) (COUNT(?inObject) AS ?inCount)    WHERE {
			{
				SELECT DISTINCT ?outObject WHERE {
				<${subject}> <${property}> ?outObject.
				}
				LIMIT ${this.size_limit}
			}
			UNION
			{
				SELECT DISTINCT ?inObject WHERE {
				?inObject <${property}> <${subject}>.
				}
				LIMIT ${this.size_limit}
			}
			OPTIONAL {
				${
					this.endpoint_type === 'wikidata'
						? `?prop wikibase:directClaim <${property}> . ?prop rdfs:label ?propLabel .`
						: `<${property}> rdf:type rdf:Property . <${property}> rdfs:label ?propLabel .`
				}
			}
			
			FILTER (lang(?propLabel) = '${this.endpoint_lang}')
			} GROUP BY ?propLabel`
		);

		if (result.length > 0) {
			const res = result[0];
			return {
				label: res.propLabel?.value || property,
				uri: property,
				out_count: +(res.outCount?.value ?? 0),
				in_count: +(res.inCount?.value ?? 0),
				related: [],
				fetched: false
			};
		} else {
			return {
				label: property,
				uri: property,
				out_count: 0,
				in_count: 0,
				related: [],
				fetched: false
			};
		}
	}

	public async fetch_properties(subject: URI) {
		const result = await this.query<{ property: BindingContent }>(
			`
			
			SELECT DISTINCT ?property  WHERE {
				{
				  ?o ?property <${subject}> .
				} UNION{
					<${subject}> ?property ?o
				}
				${
					this.endpoint_type === 'wikidata'
						? '?prop wikibase:directClaim ?property .'
						: '?property rdf:type rdf:Property .'
				}
				}`
		);

		const results: Property[] = [];
		const properties = (result.filter((c) => c.property) as Required<typeof result[number]>[]).map(
			(c) => c.property.value
		);
		const requests: Promise<Property>[] = [];
		properties.forEach((prop) => requests.push(this.fetch_property_count(subject, prop)));
		for (let i = 0; i < requests.length; i++) {
			results.push(await requests[i]);
		}
		return results;
	}

	public convert_node_to_binding_content(node: Node): BindingContent {
		return {
			type: node.type,
			value: node.id,
			datatype: node.datatype,
			'xml:lang': node.language
		};
	}
}

export const SPARQL = new SPARQL_Queries();
