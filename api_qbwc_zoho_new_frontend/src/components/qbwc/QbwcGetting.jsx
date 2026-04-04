import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Package, X, Loader2 } from 'lucide-react'

const QbwcGetting = () => {
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const navigate = useNavigate()

  const gettingData = async (module, objects, setLoading) => {
    setLoading(true)
    navigate(`/integration/qbwc/${objects}/${module}`)
  }

  const handleListCustomers = () => gettingData('list', 'customers', setLoadingCustomers)
  const handleListItems = () => gettingData('list', 'items', setLoadingItems)
  const handleNeverMatchCustomers = () => gettingData('never_match', 'customers', setLoadingCustomers)
  const handleNeverMatchItems = () => gettingData('never_match', 'items', setLoadingItems)

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] p-0 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 flex items-center justify-center bg-white shadow-sm rounded py-4">
          <h6 className="text-base font-bold text-center">Reading Data from QuickBooks</h6>
        </div>
        <div className="flex items-center justify-end pl-4">
          <Link to="/integration" title="Back to Integration">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap gap-4 items-start justify-center mt-2 mb-6">
        {/* Customers Card */}
        <div className="bg-white shadow rounded p-4 min-h-[25vh] w-full sm:w-48 flex flex-col gap-4">
          <div className="flex items-center gap-2 pt-2">
            <span className="bg-blue-100 text-blue-600 rounded p-1">
              <Users size={20} />
            </span>
            <span className="font-bold text-black">Customers</span>
          </div>
          <button
            onClick={handleListCustomers}
            className="flex items-center gap-2 w-full px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm cursor-pointer"
          >
            {loadingCustomers ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading Customers...
              </>
            ) : (
              'All Customers'
            )}
          </button>
          <button
            onClick={handleNeverMatchCustomers}
            className="flex items-center gap-2 w-full px-3 py-2 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors text-sm cursor-pointer"
          >
            {loadingCustomers ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading Customers...
              </>
            ) : (
              'Never Matched Customers'
            )}
          </button>
        </div>

        {/* Items Card */}
        <div className="bg-white shadow rounded p-4 min-h-[25vh] w-full sm:w-48 flex flex-col gap-4">
          <div className="flex items-center gap-2 pt-2">
            <span className="bg-blue-100 text-blue-600 rounded p-1">
              <Package size={20} />
            </span>
            <span className="font-bold text-black">Items</span>
          </div>
          <button
            onClick={handleListItems}
            className="flex items-center gap-2 w-full px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm cursor-pointer"
          >
            {loadingItems ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading Items...
              </>
            ) : (
              'All Items'
            )}
          </button>
          <button
            onClick={handleNeverMatchItems}
            className="flex items-center gap-2 w-full px-3 py-2 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors text-sm cursor-pointer"
          >
            {loadingItems ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading Items...
              </>
            ) : (
              'Never Matched Items'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QbwcGetting
