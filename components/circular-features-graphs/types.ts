export interface PCAData {
  experiment_name: ExperimentName
  model_name: ModelName
  display_labels: string[]
  states_pca: number[][]
  base_items?: string[]
  string_modifiers?: string[]
}

export interface PointData {
  label: string
  x: number
  y: number
}

export interface LabeledPointData extends PointData {
  showLabel: boolean
}

export type ExperimentName =
  | 'month'
  | 'weekday_very'
  | 'colour'
  | 'hsv_colour_one_red'
  | 'musical_note'
  | 'musical_note_flat_sharp'

export type ModelName = 'Gemma-2-2B' | 'Gemma-2-9B' | 'Gemma-2-27B'

export const experimentNameMap: Record<ExperimentName, string> = {
  month: 'Months',
  weekday_very: 'Weekdays',
  hsv_colour_one_red: 'HSV Colours',
  colour: 'RGB Colours',
  musical_note: 'Musical Notes',
  musical_note_flat_sharp: 'Musical Notes (Flat/Sharp)',
}

export interface LayerData {
  [key: string]: PCAData
}

export interface ModelData {
  [key: string]: LayerData
}

export interface Props {
  data?: LayerData
  experimentConfig?: {
    name: string
    base_items: string[]
    display_labels: string[]
    string_modifiers?: string[]
  }
  width?: number
  height?: number
}
