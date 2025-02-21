import {
  FinancialRecord,
  IncomeMainGroup,
  IncomeTitle,
  IncomeTitleGroup,
  YearlyFinancialData,
} from './types'

export function transformFinancialData(records: FinancialRecord[]): YearlyFinancialData[] {
  // Group records by year first
  const yearGroups = groupBy(records, (record) => record.år)

  return Object.entries(yearGroups).map(([year, yearRecords]) => {
    const yearData: YearlyFinancialData = {
      year: parseInt(year),
      categories: {},
      totalBudget: 0,
      totalOutcome: 0,
    }

    // Process each record and build the hierarchical structure
    yearRecords.forEach((record) => {
      // Create category if it doesn't exist
      if (!yearData.categories[record.inkomsttyp]) {
        yearData.categories[record.inkomsttyp] = {
          name: record.inkomsttypsnamn,
          subCategories: {},
          total: 0,
        }
      }

      // Create main group if it doesn't exist
      const category = yearData.categories[record.inkomsttyp]
      if (!category.subCategories[record.inkomsthuvudgrupp]) {
        category.subCategories[record.inkomsthuvudgrupp] = {
          code: record.inkomsthuvudgrupp,
          name: record.inkomsthuvudgruppsnamn,
          titleGroups: {},
        }
      }

      // Create title group if it doesn't exist
      const mainGroup = category.subCategories[record.inkomsthuvudgrupp]
      if (!mainGroup.titleGroups[record.inkomsttitelgrupp]) {
        mainGroup.titleGroups[record.inkomsttitelgrupp] = {
          code: record.inkomsttitelgrupp,
          name: record.inkomsttitelgruppsnamn,
          titles: {},
        }
      }

      // Add the income title
      const titleGroup = mainGroup.titleGroups[record.inkomsttitelgrupp]
      titleGroup.titles[record.inkomsttitel] = {
        code: record.inkomsttitel,
        name: record.inkomsttitelsnamn,
        budget: record.statens_budget,
        outcome: record.utfall,
      }

      // Update totals
      yearData.totalBudget += record.statens_budget
      yearData.totalOutcome += record.utfall
    })

    // Calculate totals for each level
    calculateHierarchyTotals(yearData)

    return yearData
  })
}

function calculateHierarchyTotals(yearData: YearlyFinancialData): void {
  Object.values(yearData.categories).forEach((category) => {
    category.total = 0
    Object.values(category.subCategories).forEach((mainGroup: IncomeMainGroup) => {
      mainGroup.total = 0

      Object.values(mainGroup.titleGroups).forEach((titleGroup: IncomeTitleGroup) => {
        titleGroup.total = Object.values(titleGroup.titles).reduce(
          (sum, title: IncomeTitle) => sum + title.outcome,
          0
        )
        mainGroup.total! += titleGroup.total
      })

      category.total += mainGroup.total
    })
  })
}

function groupBy<T>(array: T[], keyFn: (item: T) => string | number): { [key: string]: T[] } {
  return array.reduce(
    (result, item) => {
      const key = keyFn(item)
      ;(result[key] = result[key] || []).push(item)
      return result
    },
    {} as { [key: string]: T[] }
  )
}
