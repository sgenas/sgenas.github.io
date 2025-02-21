// Represents a single row of Swedish state finances data
export interface FinancialRecord {
  // Income type code (e.g. "1000")
  inkomsttyp: string

  // Income type name (e.g. "Statens skatteinkomster")
  inkomsttypsnamn: string

  // Main group code (e.g. "1100")
  inkomsthuvudgrupp: string

  // Main group name (e.g. "Direkta skatter på arbete")
  inkomsthuvudgruppsnamn: string

  // Main group name (e.g. "1110")
  inkomsttitelgrupp: string

  // Title group name (e.g. "Inkomstskatter")
  inkomsttitelgruppsnamn: string

  // Title code (e.g. "1111")
  inkomsttitel: string

  // Title name (e.g. "Statlig inkomstskatt")
  inkomsttitelsnamn: string

  // Year
  år: number

  // State budget amount
  statens_budget: number

  // Actual outcome amount
  utfall: number

  // Outcome year identifiers (may differ from regular identifiers)
  inkomsttyp_utfallsår: number
  inkomsttypsnamn_utfallsår: string
  inkomsthuvudgrupp_utfallsår: string
  inkomsthuvudgruppsnamn_utfallsår: string
  inkomsttitelgrupp_utfallsår: string
  inkomsttitelgruppsnamn_utfallsår: string
  inkomsttitel_utfallsår: string
  inkomsttitelsnamn_utfallsår: string
}

// Represents the hierarchical structure of income categories
export interface IncomeCategory {
  // Inkomsttyp
  code: string
  name: string
  subCategories: {
    [key: string]: IncomeMainGroup
  }
  total?: number
}

export interface IncomeMainGroup {
  // Inkomsthuvudgrupp
  code: string
  name: string
  titleGroups: {
    [key: string]: IncomeTitleGroup
  }
  total?: number
}

export interface IncomeTitleGroup {
  // Inkomsttitelgrupp
  code: string
  name: string
  titles: {
    [key: string]: IncomeTitle
  }
  total?: number
}

export interface IncomeTitle {
  // Inkomsttitel
  code: string
  name: string
  budget: number
  outcome: number
}

// Represents yearly financial data
export interface YearlyFinancialData {
  year: number
  categories: {
    [key: string]: Category
  }
  totalBudget: number
  totalOutcome: number
}

export interface Category {
  subCategories: {
    [key: string]: IncomeMainGroup
  }
  name: string
  total: number
}
