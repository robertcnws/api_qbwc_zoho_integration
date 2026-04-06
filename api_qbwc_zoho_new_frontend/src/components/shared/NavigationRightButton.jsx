import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const NavigationRightButton = ({ items, children }) => {
  const navigate = useNavigate()
  const list = items || children || []
  return (
    <div className="flex flex-wrap gap-2">
      {list.filter(item => item.visible !== false && item.visibility !== false).map((item, i) => (
        <Button
          key={i}
          variant="outline"
          size="sm"
          onClick={() => item.onClick ? item.onClick() : navigate(item.route)}
          className="flex items-center gap-1"
        >
          {item.icon}
          {item.label}
        </Button>
      ))}
    </div>
  )
}

export { NavigationRightButton }
export default NavigationRightButton
