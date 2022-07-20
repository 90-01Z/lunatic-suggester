# Notes suggester

 ## les modes de recherche proposés

Le composant de suggestion est prévu pour proposer 2 types d'expériences utilisateur distinctes 
- la recherche par prefix : les quelques lettres saisies par l'utilisateur sont comparées au début des libellés de références pour proposer des suggestions : (si l'utilisateur saisie "bon", on lui suggérera "BONnat", "BONnac-la-cote", ...). Le texte contenu dans les entités indexées n'est que très faiblement transformé. 
- la recherche par mot clef : des mots clefs de recherche sont extraits des entités proposées pour construire un index de recherche inversé. Des liste d'entités sont attaché dans ce dernier, à des mots clef de recherche, pour être suggérés à l'utilisateur lorsque celui-ci saisi un ou plusieurs terme dans le champ de recherche du formulaire.

Le mode de recherche souhaité dépend donc de la manière dont est construit l'index. Les modalités de traitement des données doivent être transmises au composant lors des phases d'indexations. (expliqué plus bas)

## indexation et format des données

### la fonction d'indexation (appendToIndex) et le hook useLunatic

La fonction d'indexation proposée dans la librairie (Javascript) attend en entrée les détails de l'index (précisé plus bas), la version store indexedDb contenant les données et enfin un tableau d'objet (au sens javaScript) à ajouter à l'index. Si l'index n'existe pas, la fonction le crée puis ajoute les nouvelles entités. Si l'index existe déjà, les objets transmis viendront s'ajouter à ceux déjà présent dans l'index.
Le hook useLunatic, fournie par la librairie propose un mode de fonctionnement où les suggesters sont chargés de manière transparente par le formulaire. Le jsonLunatic contient alors les information précisées ci-dessus. Il est ensuite possible de préciser en argument du hook, les urls des fichiers, au format JSON contenant la liste d'entité de chaque suggester. Le hook impose et assure lui-même le mode de chargement.(cette responsabilité pourrait-être déplacé vers l'intégrateur Lunatic, celui-ci proposant une fonction asynchrone plutôt qu'une liste d'url). Pour fonctionner correctement, soit le réseau internet est présent, soit les fichiers sont disponibles en local au travers des services workers.(comportement du hook à valider avec Nico)
Si ce mode de fonctionnement ne convient pas à l'intégrateur de la librairie, il peut lui-même mettre en oeuvre la fonction appendToIndex, qui permet d'ajouter des données à l'index au travers d'un web worker.(il faudrait rendre conditionnel le chargement des suggesters dans le hook tout de même)

### format des données

La seule contrainte imposée aux entités proposées est l'existence d'un attribut id à la racine des objets. Il permet d'identifier de manière unique l'entité au sein de l'index.

### paramétrage de l'index

La fonction appendToIndex attend en entrée un objet storeIndex, contenant le nom du suggester et le détails des champs d'indexation. Le hook useLunatic, transmet à cette fonction ces informations extraites du jsonLunatic fournit en entrée, éventuellement complété par l'application.

```Javascript
{
    name: string, // nom unique de l'index
    fields: [ // list des champs d'indexation
        {
            name: string, // nom de l'attribut à indexer
            rules: Array<regexp> | 'soft', // règle de tokenisation ou 'soft'
            stemming: true | false, // active la fonction de lemmatisation si rules !== soft
            language: string, // langue du stemmer
            min : integer, // taille minimun des tokens à retenir
            synonyms: Map<string, Array<string>>, // synonymes venant compléter le tokens

        }
    ],
    stopWords: Array<string>, // liste des mots à exclure
}
```

```Typescript
interface storeInfo {
    name: string;
    fields: Array<Field>;
}


interface Field {
    name: string,
    rules: Array<string> | 'soft';
    stemming?: boolean; // default true
    language?: string; // default 'French'
    synonyms?: Map<string, Array<string>>; // default aucun 
    min?: number; // default 1
}

```

Remarques:
----------
- stemmer = lemmatisation = extraction de la racine d'un mot (culture | cultures -> cultur)
- l'attribut rule avec la valeur 'soft' conduit à une transformation minime du champs (La belle nuit de Noël -> la-belle-nui-de-noel). Ce traitement est celui nécessaire pour le mode de recherche à préfixe. Tous les autres attributs de configuration sont alors négligés.
- les champs d'indexation doivent contenir du texte ou des nombres (transformé en texte). La librairie ne gère pas les chemins imbriqués. (mais pourrait si on me le demande)
- le format de déclaration est à l'usage des intégrateurs (des dev) pas directement à l'adresse de MOA ! Encore à un stade expérimental, il pourrait évoluer à terme, après consolidation de la version actuelle.
- la librairie propose par défaut une liste de stopWords français, très généraliste. Elle n'est pertinente que pour des textes pleinement rédigés. Pour des simples libellés, une liste plus courte peut-être plus opportune. (Par exemple, la liste par défaut contient toute les conjugaison de l'auxiliaire être, hors EST est aussi une direction cardinal présente dans certaine nom propre comme Grand-Est)


exemple en JSON (il manque à ce stade les données propre à la recherche, présentée plus bas)
---------------
```JSON
{
    "suggesters": [
		{
			"name": "naf-rev2",
			"url": "https://inseefr.github.io/Lunatic/storybook/naf-rev2.json", // j'aimerais bien qu'on propose une autre stratégie où le mode de récupération ne soit pas imposée (découplage : des interfaces plutôt que des implémentations)
			"fields": [
				{
					"name": "label",
					"rules": ["[\\w]+"],
					"language": "French",
					"synonyms": { "saint": ["st"] },
					"min": 2
				},
				{ "name": "id" }
			],
			"queryParser": {
				"type": "tokenized",
				"params": { "language": "French", "pattern": "[\\w.]+", "min": 1 }
			},
			"version": "1"
		},
		{
			"name": "cog-communes",
			"url": "https://inseefr.github.io/Lunatic/storybook/communes-2019.json",
			"fields": [
				{ "name": "label", "rules": "soft" },
				{ "name": "nccenr", "rules": "soft" },
				{ "name": "id", "rules": "soft" }
			],
			"order": { "type": "ascending", "field": "label" },
			"queryParser": { "type": "soft" },
			"version": "1"
		},
		{
			"name": "bailleurs-sociaux",
			"url": "https://inseefr.github.io/Lunatic/storybook/bailleurs-sociaux.json",
			"fields": [
				{
					"name": "libelle1",
					"rules": ["[\\w]+"],
					"language": "French",
					"synonyms": { "st": ["saint"] },
					"stemmer": false
				},
				{
					"name": "libelle2",
					"rules": ["[\\w]+"],
					"language": "French",
					"synonyms": { "st": ["saint"] },
					"stemmer": false
				},
				{ "name": "code" }
			],
		}
	]
}
```

:warning: D'autres attributs seront attendus pour préciser le comportement lors des phases de recherche. Toute ces information sont conservées et utilisées dans le navigateur, lors des phases de recherche.

### détail sur les opérations d'indexation
Pour les champs d'indexation de type soft, les transformations apportées restent minim : retrait des accent, passage en miniscule et transformation des espaces blanc.
Pour l'indexation de type tokenized, une fois le champ transformé en unité lexicale, une suite de filtres conditionnels et paramétrables (voir au dessus) est appliquée : 
    
1) filterLength : retire les mots trop courts
2) filterStopWords : retire les mots présents dans la liste d'exclusion
3) filterSynonyms : ajoute les synonymes pour les mots présent en tant que clef dans la map de synonymes
4) filterStemmer : lemmatise selon la langue précisée
5) filterAccentsToLower : retire les accents et passe en miniscule (traite les cédille, les ligatures et autres raffinements de la langue française !)
-) filterDouble : retire les doublons.

### structure de la base indexedDB
// TODO 

## la fonction de recherche et présentation des résultats
Pour fonctionnent correctement le champ de recherche du formulaire doit traiter les requêtes de l'utilisateur en conformité avec la manière dont ont été indexées les données (pour de la recherche à mot clef ou par préfixe).
Ces informations sont transmises à la fonction d'indexation, en charge de la création de l'index. Elles sont conservées dans le navigateur, à l'attention ultérieure de la fonction de recherche.

### paramétrage de la recherche
Ces données viennent compléter l'objet storeInfo à fournir lors de l'indexation ou le json transmis à useLunatic. Toutes ses informations, stockées lors de l'indexation, sont utiles lors des phases de consultation de l'index.

```Javascript
{
    queryParser: {
         type : "soft" | "tokenized",
         params: { 
            pattern: string, // règle d'extraction des tokens
            stemming: boolean, // active la lemmatisation
            language: string, // langue de référence pour la lemmatisation
            min: integer, // taille minimale des tokens à conserver
        }
    },
    order: { // critère de trie des suggestions (vient remplacer le score de pertinence pour la recherche à token)
        type: "ascending" | "descending", // ordre de tri alphanumérique
        field: string  // attribut des entités à comparer pour le tri (alphanumérique, mais je pourrais tester la nature du champ au besoin)
    },
    max: number,// nombre maximum de suggestions présentés à l'utilisateur
    version: number // pas encore exploité, pour versionner les données
}
```

remarques:
----------
- le queryParser 'soft' transforme la saisie utilisateur de la même manière que la rule 'soft' des champs d'indexation, pour faire fonctionner la recherche à préfixe. Pour cette valeur, le queryParser ignore params.
- le  queryParser 'tokenized' permet de décomposer la recherche utilisateur en tokens. params permet de configurer le processus de traitement de la requête utilisateur, pour la rapprocher de celle appliquées aux champs indexés.

```Typescript
interface storeInfo {
    queryParser: QueryParser;
    order?: Ordering; // default fonction score (sans effet pour la recherche à préfixe)
    max?: number; // default todo
}

interface QueryParser {
    type : "soft" | "tokenized";
    params?: { 
        pattern: string; // default [/w]+
        stemming: boolean; // default true
        language: string; // default 'French'
        min: integer; // default 1
    }
}

interface Ordering {
    type: "ascending" | "descending"; 
    field: string;
}
```

```JSON
{
	"suggesters": [
		{
			"name": "naf-rev2",
			"queryParser": {
				"type": "tokenized",
				"params": { "language": "French", "pattern": "[\\w.]+", "min": 1 }
			}
		},
		{
			"name": "cog-communes",
			"order": { "type": "ascending", "field": "label" },
			"queryParser": { "type": "soft" } 
		},
		{
			"name": "bailleurs-sociaux",
			"queryParser": {
				"type": "tokenized",
				"params": { "language": "French", "pattern": "[\\w]+", "min": "1" }
			},
			"stopWords": ["de", "la", "les", "du", "et", "au", "aux", "en"],
			"max": 12 
		}
	] 
	 
}
```
Pour les MOA, l'essentielle du paramétrage consiste à préciser dans l'attribut suggesters du jsonLunatic l'ensemble des information présentées dans les 2 sections ci-dessus. Pour commodité de présentation, les informations d'indexation et de recherche ont été séparées. Elles doivent être combinées dans les faits.
Une partie de la configuration peut-être ajoutée lors de l'intégration de la librairie, dans l'application cliente, pour alléger le json. 

### processus de sélection des suggestions et scoring

Les modalités de recherche dans l'index sont fortement conditionné par la nature d'indexedDB, une base de cache navigateur orientée objet. La seule modalité de recherche possible est la recherche par interval au sein d'un index. Elle consiste à rechercher l'ensemble des clefs d'indexations comprise entre un préfixe fournit et une valeur maximale, ajouté arbitrairement au préfixe(``` String.fromCharCode(65535)  ```). C'est ce mode de recherche qui est appliquée pour la recherche 'soft' mais aussi pour la recherche 'tokenized'.

Le processus de suggestion pour la recherche à préfixe est alors triviale. Les quelques caractères saisi par l'utilisateur permet d'extraire de l'index toutes les clefs commençant par ceux-ci. La fonction de scoring est sans effet sur l'ordre proposé par indexedDb.
Pour la recherche à mot clef, une recherche à préfixe est opérée pour chaque terme saisie par l'utilisateur. De la sorte, des suggestion arrivent bien avant qu'une clef d'indexation soit intégralement saisie dans le champs de recherche. Ce comportement semble en effet plus naturel pour un champ de suggestion. Une fonction de score est ensuite appliqué pour ordonner les résultats.Pour chaque suggestion elle recense le nombre de mot de recherche lui  correspondant.

    si l'utilisateur à saisie joyeux noel :
        - la suggestion 'noel tombe le 25' vaut 1 car elle possède juste noel dans ses tokens d'indexation
        - la suggestion 'bon et joyeux noel' vaut 2 car elle possède joyeux et noel comme tokens. Elle apparaît donc 2 fois dans les suggestions à l'issu de la recherche : une fois pour joyeux, une fois pour noel.

J'ai tenté l'introduction fastidieuse de la mesure TF-IDF (solr) dans la librairie, sans pour autant obtenir de bénéfice sensible sur la pertinence pour la naf-rev2, trop peu textuelle pour ce type de calcul.(Parfois la simplicité...)
Enfin, il est possible d'ajouter un critère de tri alphanumérique et de limiter le nombre de suggestions présentés à l'utilisateur.(voir plus haut)


## rendu et personnalisation

Le composant de suggestion propose un rendu par défaut pour l'affichage des options dans le panel de suggestion et pour le label de présentation de l'option active dans le champs de saisi (lorsqu'il n'a pas le focus).

Par défaut, si les entités possèdent un attribut label, la suggestion affiche id - label, sinon id.
Le label du champ de saisie applique la même stratégie.
Si ce comportement par défaut ne convient pas il est possible de proposer à l'intégration, des composants de rendu personnalisés.(voir stories du storybook pour l'implémentation au travers de l'orchestrateur)

 