import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DomainCard from "@/components/assets/domain-card";
import { Plus, Search, Globe, Server, Shield, Mail, Eye, EyeOff } from "lucide-react";
import { type DigitalAsset, type Client } from "@shared/schema";

interface AssetWithClient extends DigitalAsset {
  client?: Client;
}

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const { data: assets, isLoading } = useQuery<AssetWithClient[]>({
    queryKey: ['/api/assets'],
    staleTime: 30000, // 30 seconds
  });

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = !searchQuery || 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const domainAssets = filteredAssets?.filter(asset => asset.type === 'domain') || [];
  const hostingAssets = filteredAssets?.filter(asset => asset.type === 'hosting') || [];
  const otherAssets = filteredAssets?.filter(asset => !['domain', 'hosting'].includes(asset.type)) || [];

  const handleEditAsset = (asset: DigitalAsset) => {
    // TODO: Implement edit asset modal
    console.log('Edit asset:', asset);
  };

  const handleDeleteAsset = (asset: DigitalAsset) => {
    // TODO: Implement delete asset confirmation
    console.log('Delete asset:', asset);
  };

  const togglePasswordVisibility = (assetId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain':
        return <Globe className="h-4 w-4" />;
      case 'hosting':
        return <Server className="h-4 w-4" />;
      case 'ssl':
        return <Shield className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'domain':
        return 'דומיין';
      case 'hosting':
        return 'אחסון';
      case 'ssl':
        return 'תעודת SSL';
      case 'email':
        return 'אימייל';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6" data-testid="assets-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-rubik" data-testid="assets-title">
            נכסים דיגיטליים
          </h1>
          <p className="text-gray-600 mt-1">
            עקבו אחר דומיינים, אחסון ותאריכי חידוש
          </p>
        </div>
        <Button 
          className="flex items-center space-x-reverse space-x-2"
          data-testid="button-new-asset"
        >
          <Plus className="h-4 w-4" />
          <span>נכס חדש</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש נכסים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
            data-testid="search-assets"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-type">
            <SelectValue placeholder="סינון לפי סוג" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            <SelectItem value="domain">דומיין</SelectItem>
            <SelectItem value="hosting">אחסון</SelectItem>
            <SelectItem value="ssl">תעודת SSL</SelectItem>
            <SelectItem value="email">אימייל</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>דומיינים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>אחסון</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !filteredAssets || filteredAssets.length === 0 ? (
        <div className="text-center py-12" data-testid="no-assets">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || typeFilter !== "all" ? "לא נמצאו נכסים" : "אין נכסים דיגיטליים עדיין"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || typeFilter !== "all" 
              ? "נסה לשנות את החיפוש או הסינון"
              : "התחל על ידי הוספת הנכס הדיגיטלי הראשון שלך"
            }
          </p>
          {!searchQuery && typeFilter === "all" && (
            <Button data-testid="button-add-first-asset">
              <Plus className="h-4 w-4 ml-2" />
              הוסף נכס ראשון
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Assets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domains */}
            {(typeFilter === "all" || typeFilter === "domain") && domainAssets.length > 0 && (
              <Card data-testid="domains-section">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-reverse space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>דומיינים</span>
                    <span className="text-sm text-gray-500">({domainAssets.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {domainAssets.map((asset) => (
                      <DomainCard
                        key={asset.id}
                        asset={asset}
                        onEdit={handleEditAsset}
                        onDelete={handleDeleteAsset}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hosting */}
            {(typeFilter === "all" || typeFilter === "hosting") && hostingAssets.length > 0 && (
              <Card data-testid="hosting-section">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-reverse space-x-2">
                    <Server className="h-5 w-5" />
                    <span>אחסון</span>
                    <span className="text-sm text-gray-500">({hostingAssets.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hostingAssets.map((asset) => (
                      <DomainCard
                        key={asset.id}
                        asset={asset}
                        onEdit={handleEditAsset}
                        onDelete={handleDeleteAsset}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Other Assets */}
          {otherAssets.length > 0 && (
            <Card data-testid="other-assets-section">
              <CardHeader>
                <CardTitle>נכסים אחרים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherAssets.map((asset) => (
                    <DomainCard
                      key={asset.id}
                      asset={asset}
                      onEdit={handleEditAsset}
                      onDelete={handleDeleteAsset}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credentials Section */}
          {assets && assets.some(asset => asset.username || asset.password) && (
            <Card data-testid="credentials-section">
              <CardHeader>
                <CardTitle>פרטי כניסה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets
                    .filter(asset => asset.username || asset.password)
                    .map((asset) => (
                      <div key={asset.id} className="p-4 bg-gray-50 rounded-lg" data-testid={`credentials-${asset.id}`}>
                        <div className="flex items-center space-x-reverse space-x-2 mb-2">
                          {getTypeIcon(asset.type)}
                          <div className="font-medium text-gray-900">{asset.name}</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {asset.username && (
                            <div>משתמש: {asset.username}</div>
                          )}
                          {asset.password && (
                            <div className="flex items-center space-x-reverse space-x-2">
                              <span>סיסמה:</span>
                              <code className="bg-white px-2 py-1 rounded text-xs">
                                {showPasswords[asset.id] ? asset.password : '••••••••'}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(asset.id)}
                                data-testid={`toggle-password-${asset.id}`}
                              >
                                {showPasswords[asset.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                          {asset.loginUrl && (
                            <div>
                              <a 
                                href={asset.loginUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                data-testid={`login-url-${asset.id}`}
                              >
                                עמוד כניסה
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
