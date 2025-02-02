import React from 'react'

import { ModelName } from './types'

interface ModelSelectorProps {
  currentModel: ModelName
  setCurrentModel: (model: ModelName) => void
  id: string // Simple ID prop
}

export const ModelSelector = ({ currentModel, setCurrentModel, id }: ModelSelectorProps) => {
  const models = ['Gemma-2-2B', 'Gemma-2-9B', 'Gemma-2-27B']

  return (
    <div className="mb-6 flex flex-col items-center gap-4 sm:mb-8">
      <div className="flex gap-10">
        {models.map((model) => (
          <div key={model} className="flex items-center">
            <input
              type="radio"
              id={`model-${id}-${model}`}
              name={`model-selection-${id}`}
              value={model}
              checked={currentModel === model}
              onChange={() => setCurrentModel(model as ModelName)}
              className="h-4 w-4 cursor-pointer border-gray-300 text-primary-500 focus:ring-primary-200"
            />
            <label
              htmlFor={`model-${id}-${model}`}
              className="ml-2 cursor-pointer font-mono text-xs font-medium text-gray-900 dark:text-gray-300 sm:text-sm"
            >
              {model}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModelSelector
