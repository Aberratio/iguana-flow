import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Video, CheckCircle, Bookmark, AlertCircle, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LazyImage } from "@/components/LazyImage";
import { useIsMobile } from "@/hooks/use-mobile";
import { getDifficultyLabel, getFigureTypeLabel } from "@/lib/figureUtils";

interface LibraryListViewProps {
  figures: any[];
  onFigureClick: (figure: any) => void;
  canModifyFigure: (figure: any) => boolean;
  getDifficultyColor: (difficulty: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  onEdit: (figure: any) => void;
  onDelete: (figure: any) => void;
}

export const LibraryListView: React.FC<LibraryListViewProps> = ({
  figures,
  onFigureClick,
  canModifyFigure,
  getDifficultyColor,
  getStatusIcon,
  onEdit,
  onDelete,
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-3">
      {figures.map((figure) => (
        <Card
          key={figure.id}
          className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group overflow-hidden"
          onClick={() => onFigureClick(figure)}
        >
          <CardContent className="p-3 md:p-4">
            <div className="flex gap-3 md:gap-4">
              {/* Thumbnail */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                {figure.image_url ? (
                  <LazyImage
                    src={figure.image_url}
                    alt={figure.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    skeletonClassName="w-full h-full rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center rounded-lg">
                    <span className="text-3xl">🤸</span>
                  </div>
                )}

                {/* Status icon overlay */}
                {getStatusIcon(figure.progress_status) && (
                  <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm rounded-full p-1">
                    {getStatusIcon(figure.progress_status)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                {/* Top section */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-white font-semibold text-sm md:text-base leading-tight line-clamp-1 flex-1">
                      {figure.name}
                    </h3>
                    {/* Premium badge - removed, only sport paths are paid */}
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge
                      className={`${getDifficultyColor(
                        figure.difficulty_level
                      )} text-xs border font-medium`}
                    >
                      {getDifficultyLabel(figure.difficulty_level)}
                    </Badge>
                    <span className="text-white/60 text-xs capitalize">
                      {figure.category}
                    </span>
                    <div
                      className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        figure.type === "single_figure"
                          ? "bg-blue-500/20 text-blue-300"
                          : figure.type === "combo"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-orange-500/20 text-orange-300"
                      }`}
                    >
                      {getFigureTypeLabel(figure.type)}
                    </div>
                    {figure.video_url && (
                      <div className="flex items-center gap-1 text-white/60">
                        <Video className="w-3 h-3" />
                        {!isMobile && <span className="text-xs">Wideo</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canModifyFigure(figure) && (
                <div className="flex-shrink-0">
                  {isMobile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4 text-white/60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900/95 border-white/20">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(figure);
                          }}
                          className="text-blue-400"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(figure);
                          }}
                          className="text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(figure);
                        }}
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(figure);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
