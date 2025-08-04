import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Image, FileSpreadsheet, FolderOpen } from "lucide-react";

interface ClientFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string;
}

export default function ClientFiles() {
  const { data: files, isLoading } = useQuery<ClientFile[]>({
    queryKey: ['/api/client/files'],
    staleTime: 30000, // 30 seconds
  });

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-600" />;
    } else if (type.includes('image')) {
      return <Image className="h-6 w-6 text-blue-600" />;
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeText = (type: string) => {
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('image')) return 'תמונה';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'XLSX';
    if (type.includes('zip')) return 'ZIP';
    return 'קובץ';
  };

  if (isLoading) {
    return (
      <Card data-testid="client-files-loading">
        <CardHeader>
          <CardTitle>קבצים ומסמכים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center p-3 border border-gray-200 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-lg ml-3" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="w-6 h-6" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="client-files">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          קבצים ומסמכים
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!files || files.length === 0 ? (
          <div className="text-center py-8" data-testid="no-client-files">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין קבצים זמינים</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid={`client-file-${file.id}`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center ml-3 flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate" data-testid="file-name">
                    {file.name}
                  </div>
                  <div className="text-sm text-gray-600" data-testid="file-details">
                    {getFileTypeText(file.type)} • {formatFileSize(file.size)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => window.open(file.downloadUrl, '_blank')}
                  data-testid={`download-file-${file.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
