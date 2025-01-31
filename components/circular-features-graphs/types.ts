export interface PCData {
  experiment_name: ExperimentType
  model_config: string
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

export type ExperimentType =
  | 'month'
  | 'musical_note'
  | 'musical_note_flat_sharp'
  | 'hsv_colour_one_red'
  | 'colour'
  | 'weekday_very'

export interface LayerData {
  [key: string]: PCData
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
