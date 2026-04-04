import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CustomFilter = ({ config }) => {
  const { filter, handleFilterChange, listValues } = config
  return (
    <Select value={filter} onValueChange={(value) => handleFilterChange({ target: { value } })}>
      <SelectTrigger className="w-full min-w-[180px] max-w-[280px] h-9 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {listValues.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { CustomFilter }
export default CustomFilter
