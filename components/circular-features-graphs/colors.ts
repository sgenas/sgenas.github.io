// colors.ts
import * as d3 from 'd3'

type ExperimentType =
  | 'month'
  | 'musical_note'
  | 'musical_note_flat_sharp'
  | 'hsv_colour_one_red'
  | 'colour'
  | 'weekday_very'

const coreColors = {
  red: '#FF0000',
  orange: '#FFA500',
  yellow: '#FFD700',
  green: '#00FF00',
  cyan: '#00FFFF',
  blue: '#0000FF',
  purple: '#8A2BE2',
  magenta: '#FF00FF',

  // Additional shades
  lightBlue: '#66CCEE',
  darkBlue: '#0077BB',
  lightGreen: '#90EE90',
  darkGreen: '#228B22',
  gold: '#DAA520',
  brown: '#8B4513',
}

const colorPalettes = {
  musical_notes: {
    domain: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    range: [
      coreColors.blue,
      coreColors.green,
      coreColors.yellow,
      coreColors.orange,
      coreColors.red,
      coreColors.purple,
      coreColors.magenta,
    ],
  },
  hsv_colours: {
    domain: ['Red', 'Yellow', 'Green', 'Cyan', 'Blue', 'Magenta'],
    range: [
      coreColors.red,
      coreColors.yellow,
      coreColors.green,
      coreColors.cyan,
      coreColors.blue,
      coreColors.magenta,
    ],
  },
  colours: {
    domain: ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Magenta', 'Violet'],
    range: [
      coreColors.red,
      coreColors.orange,
      coreColors.yellow,
      coreColors.green,
      coreColors.cyan,
      coreColors.blue,
      coreColors.magenta,
      coreColors.purple,
    ],
  },
}

const monthColors = {
  // Winter months - blues
  Dec: coreColors.darkBlue,
  Jan: coreColors.blue,
  Feb: coreColors.lightBlue,
  // Spring months - greens
  Mar: coreColors.lightGreen,
  Apr: coreColors.green,
  May: coreColors.darkGreen,
  // Summer months - warm colors
  Jun: coreColors.yellow,
  Jul: coreColors.orange,
  Aug: coreColors.red,
  // Fall months - earth tones
  Sep: coreColors.gold,
  Oct: coreColors.orange,
  Nov: coreColors.brown,
  // Seasons
  Winter: coreColors.blue,
  Spring: coreColors.green,
  Summer: coreColors.orange,
  Fall: coreColors.gold,
}

const weekdayColors = {
  Mon: coreColors.blue, // Start with cool colors
  Tue: coreColors.cyan,
  Wed: coreColors.green, // Middle of week transitions
  Thu: coreColors.yellow,
  Fri: coreColors.orange, // Warm up toward weekend
  Sat: coreColors.red, // Weekend is warm colors
  Sun: coreColors.magenta,
}

const getMonthColor = (label: string): string => {
  const base = label.replace(/(Early In |Late In )/, '')
  return monthColors[base] || '#999999'
}

const getWeekdayColor = (label: string): string => {
  // Extract the base weekday (remove "Very Early On" or "Very Late On" prefix)
  const base = label.replace(/(Very Early On |Very Late On )/, '')
  return weekdayColors[base] || '#999999'
}

export const createColorScale = (experimentName: ExperimentType, labels?: string[]) => {
  switch (experimentName) {
    case 'month':
      return d3
        .scaleOrdinal<string>()
        .domain(labels || [])
        .range(labels?.map(getMonthColor) || [])
    case 'weekday_very':
      return d3
        .scaleOrdinal<string>()
        .domain(labels || [])
        .range(labels?.map(getWeekdayColor) || [])
    case 'musical_note':
    case 'musical_note_flat_sharp':
      return d3
        .scaleOrdinal<string>()
        .domain(colorPalettes.musical_notes.domain)
        .range(colorPalettes.musical_notes.range)

    case 'hsv_colour_one_red':
      return d3
        .scaleOrdinal<string>()
        .domain(colorPalettes.hsv_colours.domain)
        .range(colorPalettes.hsv_colours.range)

    case 'colour':
      return d3
        .scaleOrdinal<string>()
        .domain(colorPalettes.colours.domain)
        .range(colorPalettes.colours.range)

    default:
      return d3.scaleOrdinal<string>(d3.schemeCategory10)
  }
}

export const getPointColor = (
  label: string,
  experimentName: string,
  colorScale: d3.ScaleOrdinal<string, string>
): string => {
  if (experimentName.includes('colour')) {
    return colorScale(label)
  }
  if (experimentName.includes('musical_note')) {
    return colorScale(label.charAt(0))
  }
  return colorScale(label)
}
