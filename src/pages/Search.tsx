
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search as SearchIcon, Filter, Download, Eye } from 'lucide-react'
import { agriculturalAPI } from '@/services/api'

interface SearchResult {
  id: string
  domainCode: string
  domain: string
  areaCode: number
  area: string
  elementCode: number
  element: string
  itemCode: number | string
  item: string
  year: number
  unit: string
  value: number
  flag: string
  flagDescription: string
}

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<any>(null)

  // Load filters on component mount
  useEffect(() => {
    loadFilters()
  }, [])

  const loadFilters = async () => {
    try {
      const response = await agriculturalAPI.getFilters()
      setFilters(response.data.data)
    } catch (error) {
      console.error('Failed to load filters:', error)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (searchQuery) params.query = searchQuery
      if (selectedDomain !== 'all') params.domainCode = selectedDomain
      if (selectedArea !== 'all') params.area = selectedArea
      if (selectedYear !== 'all') params.year = selectedYear

      const response = await agriculturalAPI.search(params)
      setResults(response.data.data)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Export functionality
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Domain,Area,Item,Element,Year,Value,Unit,Flag\n" +
      results.map(r => 
        `${r.domain},${r.area},${r.item},${r.element},${r.year},${r.value},${r.unit},${r.flag}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "agricultural_data.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search Agricultural Data</h1>
        <p className="text-gray-600">Find specific agricultural statistics and producer prices</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Filter data by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Query</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items, areas, elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

                              <div className="space-y-2">
                    <label className="text-sm font-medium">Domain</label>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Domains</SelectItem>
                        {filters?.domainCodes?.map((code: string) => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Area</label>
                    <Select value={selectedArea} onValueChange={setSelectedArea}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                        {filters?.areas?.slice(0, 20).map((area: string) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {filters?.years?.slice(0, 20).map((year: number) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
          </div>

                          <div className="flex space-x-2 mt-4">
                  <Button onClick={handleSearch} className="flex items-center space-x-2" disabled={loading}>
                    <SearchIcon className="h-4 w-4" />
                    <span>{loading ? 'Searching...' : 'Search'}</span>
                  </Button>
                  <Button variant="outline" onClick={handleExport} disabled={results.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
            <CardDescription>Found {results.length} matching records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{result.domainCode}</Badge>
                        <Badge variant="outline">{result.flag}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{result.item}</h3>
                      <p className="text-gray-600">{result.element}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📍 {result.area}</span>
                        <span>📅 {result.year}</span>
                        <span>📊 {result.value.toLocaleString()} {result.unit}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SearchPage
