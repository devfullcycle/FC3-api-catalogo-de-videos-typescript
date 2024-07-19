interface ICriteria {
  applyCriteria(data: any[]): any[];
}

class FindByNameCriteria implements ICriteria {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  applyCriteria(data: any[]): any[] {
    return data.filter((item) => item.name === this.name);
  }
}

class FindByDescriptionCriteria implements ICriteria {
  private description: string;

  constructor(description: string) {
    this.description = description;
  }

  applyCriteria(data: any[]): any[] {
    return data.filter((item) => item.description === this.description);
  }
}

let categoriesCollection = [
  { name: 'Category 1', description: 'Description 1' },
  { name: 'Category 2', description: 'Description 2' },
  { name: 'Category 3', description: 'Description 3' },
  { name: 'Category 4', description: 'Description 4' },
  { name: 'Category 5', description: 'Description 5' },
];

let findByNameCriteria = new FindByNameCriteria('Category 2');

let filteredData = findByNameCriteria.applyCriteria(categoriesCollection);

console.log(filteredData);

let findByDescriptionCriteria = new FindByDescriptionCriteria('Description 4');

filteredData = findByDescriptionCriteria.applyCriteria(categoriesCollection);

console.log(filteredData);

class AndCriteria implements ICriteria {
  private criterias: ICriteria[];

  constructor(criterias: ICriteria[]) {
    this.criterias = criterias;
  }

  applyCriteria(data: any[]): any[] {
    let filteredData = new Array<any[]>();

    this.criterias.forEach((criteria) => {
      filteredData.push(criteria.applyCriteria(data) as any[]);
    });

    //check if the data is in all the arrays
    return filteredData.reduce((acc, current) => {
      return acc.filter((item) => current.includes(item));
    });
  }
}

let andCriteria = new AndCriteria([
  new FindByNameCriteria('Category 2'),
  new FindByDescriptionCriteria('Description 4'),
]);

filteredData = andCriteria.applyCriteria(categoriesCollection);

console.log(filteredData);

andCriteria = new AndCriteria([
  new FindByNameCriteria('Category 2'),
  new FindByDescriptionCriteria('Description 2'),
]);

console.log(andCriteria.applyCriteria(categoriesCollection));

class OrCriteria implements ICriteria {
  private criterias: ICriteria[];

  constructor(criterias: ICriteria[]) {
    this.criterias = criterias;
  }

  applyCriteria(data: any[]): any[] {
    let filteredData = new Array<any[]>();

    this.criterias.forEach((criteria) => {
      filteredData.push(criteria.applyCriteria(data) as any[]);
    });

    //check if the data is in any of the arrays and remove duplicates
    return filteredData.reduce((acc, current) => {
      return [...new Set([...acc, ...current])];
    });
  }
}

let orCriteria = new OrCriteria([
  new FindByNameCriteria('Category 2'),
  new FindByDescriptionCriteria('Description 4'),
]);

filteredData = orCriteria.applyCriteria(categoriesCollection);

console.log(filteredData);

type Filter = { [key: string | 'AND' | 'OR']: any | any[] };

class CriteriaBuilder {
  private _sortBy: string;
  private _sortDirection: string;
  private _limit: number;
  private _offset: number;

  private _filter: Filter;

  constructor() {
    this._sortBy = '';
    this._sortDirection = '';
    this._limit = 0;
    this._offset = 0;
    this._filter = {};
  }

  sortBy(sortBy: string): CriteriaBuilder {
    this._sortBy = sortBy;
    return this;
  }

  sortDirection(sortDirection: string): CriteriaBuilder {
    this._sortDirection = sortDirection;
    return this;
  }

  limit(limit: number): CriteriaBuilder {
    this._limit = limit;
    return this;
  }

  offset(offset: number): CriteriaBuilder {
    this._offset = offset;
    return this;
  }

  filter(filter: Filter): CriteriaBuilder {
    this._filter = filter;
    return this;
  }

  // build(): ICriteria {
  //   //...
  // }
}

// let criteriaBuilder = new CriteriaBuilder();

// criteriaBuilder.filter({
//   AND: [{ name: 'Category 2' }, { description: 'Description 4' }],
// });
