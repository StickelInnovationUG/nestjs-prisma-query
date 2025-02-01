export const operatorMap = {
  $eq: "equals",
  $ne: "not",
  $lt: "lt",
  $lte: "lte",
  $gt: "gt",
  $gte: "gte",
  $contains: "contains",
  $startsWith: "startsWith",
  $endsWith: "endsWith",
  $in: "in",
  $notIn: "notIn",
};

export const operatorExamples = {
  empty: {
    summary: "No filter",
    value: "",
  },
  equals: {
    summary: "equals",
    value: "$eq:{value}",
  },
  not: {
    summary: "does not equal",
    value: "$ne:{value}",
  },
  lt: {
    summary: "less than",
    value: "$lt:{value}",
  },
  lte: {
    summary: "less than or equal to",
    value: "$lte:{value}",
  },
  gt: {
    summary: "greater than",
    value: "$gt:{value}",
  },
  gte: {
    summary: "greater than or equal to",
    value: "$gte:{value}",
  },
  contains: {
    summary: "contains",
    value: "$contains:{value}",
  },
  startsWith: {
    summary: "starts with",
    value: "$startsWith:{value}",
  },
  endsWith: {
    summary: "ends with",
    value: "$endsWith:{value}",
  },
  in: {
    summary: "in the specified values",
    value: "$in:[{value1}, {value2}]",
  },
  notIn: {
    summary: "not in the specified values",
    value: "$notIn:[{value1}, {value2}]",
  },
  // and: {
  //   summary: 'logical AND',
  //   value:
  //     '$AND=filter.{filterName}=$endsWith:{filterValue}|filter.{filterName}=$endsWith:{filterValue}',
  // },
  // or: {
  //   summary: 'logical OR',
  //   value:
  //     '$OR=filter.{filterName}=$endsWith:{filterValue}|filter.{filterName}=$endsWith:{filterValue}',
  // },
  // not: {
  //   summary: 'logical NOT',
  //   value: '$NOT=filter.{filterName}=$endsWith:{filterValue}',
  // },
};
