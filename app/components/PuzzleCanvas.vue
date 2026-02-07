<template>
    <canvas ref="puzzleCanvas" :width="width" :height="height"></canvas>
</template>

<script>
import { debounce } from 'lodash-es'

export default {
    name: "PuzzleRenderer",
    props: {
        rowData: {
            type: Array,
            required: true,
            default: () => [],
        },
        regions: {
            type: Array,
            required: true,
            default: () => [],
        },
        width: {
            type: Number,
            default: 800,
        },
        height: {
            type: Number,
            default: 600,
        },
        debounceDelay: {
            type: Number,
            default: 100, // Debounce delay in milliseconds
        },
    },
    data() {
        return {
            ctx: null,
            cellSize: 64,
            gridWidth: 8,
            gridHeight: 0,
            cachedOffsets: { offsetX: 0, offsetY: 0 },
            debouncedRedraw: null,
        };
    },
    watch: {
        rowData: { handler: 'scheduleRedraw', deep: true },
        regions: { handler: 'scheduleRedraw', deep: true },
        width: 'scheduleRedraw',
        height: 'scheduleRedraw',
    },
    mounted() {
        this.ctx = this.$refs.puzzleCanvas.getContext("2d");

        // Create debounced version of redraw method
        this.debouncedRedraw = debounce(this.redraw, this.debounceDelay);

        // Initial draw without debouncing
        this.redraw();
    },
    beforeUnmount() {
        // Cancel any pending debounced calls on component unmount
        if (this.debouncedRedraw) {
            this.debouncedRedraw.cancel();
        }
    },
    methods: {
        /**
         * Schedule a redraw with debouncing to improve performance
         */
        scheduleRedraw() {
            if (this.debouncedRedraw) {
                this.debouncedRedraw();
            } else {
                // Fallback if debounced function not initialized yet
                this.redraw();
            }
        },

        redraw() {
            if (!this.ctx || !this.rowData || this.rowData.length === 0) return;

            this.gridHeight = this.rowData.length;
            this.gridWidth = this.rowData.length > 0 ? this.rowData[0].length : 8;

            this.ctx.fillStyle = '#fbf9f5';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.calculateAndCacheContourBounds();

            this.drawBaseGrid();
            this.renderBackRegions();
            this.renderRegions();
        },

        calculateAndCacheContourBounds() {
            const activeCoords = [];
            for (let r = 0; r < this.rowData.length; r++) {
                for (let c = 0; c < this.rowData[r].length; c++) {
                    if (this.rowData[r][c] === 1) activeCoords.push({ x: c, y: r });
                }
            }
            if (activeCoords.length === 0) return;
            const minX = Math.min(...activeCoords.map(c => c.x));
            const maxX = Math.max(...activeCoords.map(c => c.x));
            const gridPixelWidth = (maxX - minX + 1) * this.cellSize;
            const offsetX = (this.width - gridPixelWidth) / 2 - minX * this.cellSize;
            const offsetY = 50;
            this.cachedOffsets = { offsetX, offsetY };
        },

        getCellPosition(row, col) {
            const { offsetX, offsetY } = this.cachedOffsets;
            return { x: offsetX + col * this.cellSize, y: offsetY + row * this.cellSize };
        },

        drawBaseGrid() {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            for (let r = 0; r < this.gridHeight; r++) {
                for (let c = 0; c < this.gridWidth; c++) {
                    const pos = this.getCellPosition(r, c);
                    this.drawRoundedRect(this.ctx, pos.x, pos.y, this.cellSize, this.cellSize, this.cellSize / 5);
                    this.ctx.fill();
                }
            }
        },

        // 已重构以支持多个不相连的区域和内轮廓
        renderBackRegions() {
            // 1. 智能查找所有独立的、不相连的区域（岛屿）
            const connectedRegions = this.findConnectedRegions(this.rowData);
            if (connectedRegions.length === 0) return;

            // 2. 为每一个独立的区域分别绘制背景和轮廓
            connectedRegions.forEach(regionCoords => {
                // 2.1 获取该区域的所有轮廓（外轮廓和内轮廓）
                const boundaryResult = this.getRegionBoundary(regionCoords);

                // 兼容旧版本返回值（如果是数组）或新版本返回值（如果是对象）
                let outerContour, innerContours = [];
                if (Array.isArray(boundaryResult)) {
                    // 旧版本返回值，只有外轮廓
                    outerContour = boundaryResult;
                } else {
                    // 新版本返回值，包含外轮廓和内轮廓
                    outerContour = boundaryResult.outerContour || [];
                    innerContours = boundaryResult.innerContours || [];
                }

                if (!outerContour || outerContour.length === 0) return;

                // 2.2 绘制该区域的米色外轮廓
                const outerPixelPoints = outerContour.map(p => ({
                    x: this.cachedOffsets.offsetX + p.x * this.cellSize,
                    y: this.cachedOffsets.offsetY + p.y * this.cellSize,
                }));

                const expandedOuterPoints = this.offsetPolygon(outerPixelPoints, -4);
                this.ctx.fillStyle = '#dccbc3';
                this.ctx.beginPath();
                this.drawSmoothPath(this.ctx, expandedOuterPoints, 12, true);

                // 2.3 处理内轮廓（如果有）
                if (innerContours && innerContours.length > 0) {
                    // 为每个内轮廓创建一个"洞"
                    innerContours.forEach(innerContour => {
                        const innerPixelPoints = innerContour.map(p => ({
                            x: this.cachedOffsets.offsetX + p.x * this.cellSize,
                            y: this.cachedOffsets.offsetY + p.y * this.cellSize,
                        }));

                        // 内轮廓需要向内偏移
                        const expandedInnerPoints = this.offsetPolygon(innerPixelPoints, -4);

                        // 使用非零环绕规则创建"洞"
                        this.ctx.moveTo(expandedInnerPoints[0].x, expandedInnerPoints[0].y);
                        this.drawSmoothPath(this.ctx, expandedInnerPoints, 12, false);
                    });
                }

                this.ctx.fill();

                // 2.4 为该区域中的每一个单元格独立绘制白色底色
                this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                const cornerRadius = 8;
                const inset = 4;
                const adjustedSize = this.cellSize - inset * 2;
                regionCoords.forEach(cell => {
                    const pos = this.getCellPosition(cell.y, cell.x);
                    this.drawRoundedRect(this.ctx, pos.x + inset, pos.y + inset, adjustedSize, adjustedSize, cornerRadius);
                    this.ctx.fill();
                });


            });
        },

        renderRegions() {
            this.regions.forEach(region => {
                if (!region.coordinates || region.coordinates.length === 0) return;

                // 获取区域边界
                const boundaryResult = this.getRegionBoundary(region.coordinates);

                // 兼容旧版本返回值（如果是数组）或新版本返回值（如果是对象）
                let boundaryPoints;
                let innerContours = [];
                if (Array.isArray(boundaryResult)) {
                    // 旧版本返回值，只有外轮廓
                    boundaryPoints = boundaryResult;
                } else if (boundaryResult && boundaryResult.outerContour) {
                    // 新版本返回值，使用外轮廓
                    boundaryPoints = boundaryResult.outerContour;
                    innerContours = boundaryResult.innerContours || [];
                } else {
                    return; // 没有有效的边界点
                }

                if (boundaryPoints.length === 0) return;

                const pixelPoints = boundaryPoints.map(p => ({
                    x: this.cachedOffsets.offsetX + p.x * this.cellSize,
                    y: this.cachedOffsets.offsetY + p.y * this.cellSize,
                }));
                const marginedPoints = this.offsetPolygon(pixelPoints, 4);
                const color = this.getRegionColor(region.computedValue);

                this.ctx.beginPath();
                this.drawSmoothPath(this.ctx, marginedPoints, 12, false);
                this.ctx.closePath();

                // 处理内轮廓（挖洞）
                if (innerContours.length > 0) {
                    innerContours.forEach(inner => {
                        const innerPixels = inner.map(p => ({
                            x: this.cachedOffsets.offsetX + p.x * this.cellSize,
                            y: this.cachedOffsets.offsetY + p.y * this.cellSize,
                        }));
                        // 内轮廓 Offset 4 (Expand Hole = Shrink Region from inside)
                        const marginedInner = this.offsetPolygon(innerPixels, 4);
                        if (marginedInner.length > 0) {
                            this.drawSmoothPath(this.ctx, marginedInner, 12, false);
                            this.ctx.closePath();
                        }
                    });
                }

                this.ctx.fillStyle = this.hexToRgba(color, 0.3);
                this.ctx.fill();

                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([8, 12]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                this.drawRegionValue(region, color);
            });
        },

        // 新增：查找所有连通区域（岛屿）的算法
        findConnectedRegions(rowData) {
            const R = rowData.length;
            if (R === 0) return [];
            const C = rowData[0].length;
            const visited = Array(R).fill().map(() => Array(C).fill(false));
            const regions = [];

            for (let r = 0; r < R; r++) {
                for (let c = 0; c < C; c++) {
                    if (rowData[r][c] === 1 && !visited[r][c]) {
                        const currentRegion = [];
                        const queue = [{ r, c }];
                        visited[r][c] = true;

                        while (queue.length > 0) {
                            const { r: currR, c: currC } = queue.shift();
                            currentRegion.push({ x: currC, y: currR });
                            const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                            for (const [dr, dc] of neighbors) {
                                const newR = currR + dr;
                                const newC = currC + dc;
                                if (newR >= 0 && newR < R && newC >= 0 && newC < C &&
                                    rowData[newR][newC] === 1 && !visited[newR][newC]) {
                                    visited[newR][newC] = true;
                                    queue.push({ r: newR, c: newC });
                                }
                            }
                        }
                        regions.push(currentRegion);
                    }
                }
            }
            return regions;
        },

        getRegionBoundary(coords) {
            const edges = new Map();
            const coordSet = new Set(coords.map(c => `${c.x},${c.y}`));
            for (const coord of coords) {
                const { x, y } = coord;
                const p1 = `${x},${y}`, p2 = `${x + 1},${y}`, p3 = `${x + 1},${y + 1}`, p4 = `${x},${y + 1}`;
                if (!coordSet.has(`${x},${y - 1}`)) this.addEdge(edges, p1, p2);
                if (!coordSet.has(`${x + 1},${y}`)) this.addEdge(edges, p2, p3);
                if (!coordSet.has(`${x},${y + 1}`)) this.addEdge(edges, p4, p3);
                if (!coordSet.has(`${x - 1},${y}`)) this.addEdge(edges, p1, p4);
            }
            if (edges.size === 0) return [];

            // 查找所有独立的边界路径（包括外轮廓和内轮廓）
            const allPaths = [];
            const visitedEdges = new Set();

            // 遍历所有边缘，为每个未访问的边缘构建一个完整的边界路径
            for (const [startNode, neighbors] of edges) {
                if (visitedEdges.has(startNode)) continue;

                const path = [];
                let previousNode = startNode;
                let currentNode = neighbors[0];

                // 标记这条边为已访问
                visitedEdges.add(startNode);
                visitedEdges.add(currentNode);
                path.push(startNode, currentNode);

                while (currentNode !== startNode) {
                    const candidates = edges.get(currentNode);
                    if (!candidates) break;

                    const nextNode = candidates.find(n => n !== previousNode);
                    if (!nextNode) break;

                    previousNode = currentNode;
                    currentNode = nextNode;
                    visitedEdges.add(currentNode);
                    path.push(currentNode);
                }

                if (path.length > 2) {
                    // 转换路径点为坐标
                    const pathCoords = path.map(p => {
                        const [x, y] = p.split(',').map(Number);
                        return { x, y };
                    });

                    // 移除最后一个重复的点
                    if (pathCoords.length > 0) {
                        pathCoords.pop();
                    }

                    allPaths.push(pathCoords);
                }
            }

            // 如果没有找到任何路径，返回空数组
            if (allPaths.length === 0) return [];

            // 找出最外层的轮廓（面积最大的）
            let maxArea = -1;
            let outerContourIndex = 0;

            // 计算每个轮廓的有符号面积
            const signedAreas = allPaths.map(path => this.calculateSignedPolygonArea(path));

            for (let i = 0; i < allPaths.length; i++) {
                const area = Math.abs(signedAreas[i]);
                if (area > maxArea) {
                    maxArea = area;
                    outerContourIndex = i;
                }
            }

            const outerContour = allPaths[outerContourIndex];
            // 外轮廓应该是顺时针（面积为正）
            if (signedAreas[outerContourIndex] < 0) {
                outerContour.reverse();
            }

            const innerContours = allPaths.filter((_, i) => i !== outerContourIndex);
            // 内轮廓应该是逆时针（面积为负）
            innerContours.forEach((contour) => {
                if (this.calculateSignedPolygonArea(contour) > 0) {
                    contour.reverse();
                }
            });

            // 返回所有轮廓，包括外轮廓和内轮廓
            return {
                outerContour: outerContour,
                innerContours: innerContours
            };
        },

        // 计算多边形有符号面积（用于确定方向）
        // 正值通常表示顺时针（在屏幕坐标系中，y向下）
        calculateSignedPolygonArea(points) {
            let area = 0;
            for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                area += points[i].x * points[j].y;
                area -= points[j].x * points[i].y;
            }
            return area / 2;
        },

        // 保留旧方法名以防兼容性，但内部调用新的
        calculatePolygonArea(points) {
            return Math.abs(this.calculateSignedPolygonArea(points));
        },

        addEdge(edgeMap, p1, p2) {
            if (!edgeMap.has(p1)) edgeMap.set(p1, []);
            if (!edgeMap.has(p2)) edgeMap.set(p2, []);
            edgeMap.get(p1).push(p2);
            edgeMap.get(p2).push(p1);
        },

        drawSmoothPath(ctx, points, radius, shouldBeginAndClose = true) {
            if (points.length < 2) return;
            if (shouldBeginAndClose) ctx.beginPath();
            const getPointOnLine = (p1, p2, dist) => {
                const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                if (len < 1e-6) return p1;
                return { x: p1.x + dist * (p2.x - p1.x) / len, y: p1.y + dist * (p2.y - p1.y) / len };
            };
            const pathSegments = [];
            for (let i = 0; i < points.length; i++) {
                const p1 = points[(i + points.length - 1) % points.length];
                const p2 = points[i];
                const p3 = points[(i + 1) % points.length];
                const d1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const d2 = Math.hypot(p3.x - p2.x, p3.y - p2.y);
                const r = Math.min(radius, d1 / 2, d2 / 2);
                pathSegments.push({
                    start: getPointOnLine(p2, p1, r),
                    corner: p2,
                    end: getPointOnLine(p2, p3, r)
                });
            }
            ctx.moveTo(pathSegments[0].start.x, pathSegments[0].start.y);
            for (let i = 0; i < pathSegments.length; i++) {
                const current = pathSegments[i];
                const next = pathSegments[(i + 1) % pathSegments.length];
                ctx.lineTo(current.start.x, current.start.y);
                ctx.quadraticCurveTo(current.corner.x, current.corner.y, current.end.x, current.end.y);
                ctx.lineTo(next.start.x, next.start.y);
            }
            if (shouldBeginAndClose) ctx.closePath();
        },

        getRegionColor(value) {
            if (value === "=") return "#d63031";
            if (value === "≠") return "#00b894";
            if (String(value).startsWith(">")) return "#6c5ce7";
            if (String(value).startsWith("<")) return "#e17055";
            return "#0984e3";
        },

        drawRegionValue(region, color) {
            const coords = region.coordinates;
            const bottomMostY = Math.max(...coords.map(c => c.y));
            const bottomPoints = coords.filter(c => c.y === bottomMostY);
            const rightMostX = Math.max(...bottomPoints.map(c => c.x));
            const pos = this.getCellPosition(bottomMostY, rightMostX);
            const diamondX = pos.x + this.cellSize - 10, diamondY = pos.y + this.cellSize - 10;
            const diamondSize = 30, radius = 4;
            this.ctx.save();
            this.ctx.translate(diamondX, diamondY);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.fillStyle = color;
            this.drawRoundedRect(this.ctx, -diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize, radius);
            this.ctx.fill();
            this.ctx.restore();
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "bolder 16px Consolas, monospace";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(region.computedValue.toString(), diamondX, diamondY);
        },

        drawRoundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        },

        offsetPolygon(points, offset) {
            const result = [];
            for (let i = 0; i < points.length; i++) {
                const p1 = points[(i + points.length - 1) % points.length];
                const p2 = points[i];
                const p3 = points[(i + 1) % points.length];
                const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
                const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
                const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
                if (l1 < 1e-6 || l2 < 1e-6) continue;
                const n1 = { x: -v1.y / l1, y: v1.x / l1 };
                const n2 = { x: -v2.y / l2, y: v2.x / l2 };
                const bisector = { x: n1.x + n2.x, y: n1.y + n2.y };
                const bisectorLen = Math.hypot(bisector.x, bisector.y);
                if (bisectorLen < 1e-6) continue;
                const angle = Math.acos(Math.max(-1, Math.min(1, n1.x * n2.x + n1.y * n2.y)));
                if (Math.abs(Math.sin(angle / 2)) < 1e-6) continue;
                const miter = offset / Math.sin(angle / 2);
                result.push({ x: p2.x + miter * bisector.x / bisectorLen, y: p2.y + miter * bisector.y / bisectorLen });
            }
            return result;
        },

        hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
    },
};
</script>