# Role Comparison Tool

A comprehensive role comparison system for the Hotel Operations Hub that allows administrators to compare roles side-by-side, understand permission differences, and make informed decisions about role management.

## Features

### 🔍 **Role Selection & Filtering**
- Select up to 4 roles for comparison
- Filter by system/custom roles
- Search roles by name and description
- Real-time role availability and selection limits

### 📊 **Multiple Comparison Views**
- **Summary View**: High-level metrics and recommendations
- **Matrix View**: Detailed permission matrix with filtering
- **Diff View**: Side-by-side permission differences
- **Charts View**: Visual analytics and insights

### 📈 **Advanced Analytics**
- Permission similarity scoring
- Coverage gap analysis
- Statistical summaries (mean, median, variance)
- Category overlap analysis
- Role distance calculations

### 🎨 **Data Visualizations**
- Statistical charts with key metrics
- Heatmaps showing permission coverage
- Venn diagrams for overlap visualization (2-3 roles)
- Network graphs showing role relationships

### 📤 **Export Capabilities**
- PDF reports with charts and analysis
- Excel workbooks with detailed matrices
- CSV data for external analysis
- JSON data for programmatic use
- Markdown reports for documentation

### 💡 **Intelligent Recommendations**
- Role consolidation suggestions
- Permission gap identification
- Optimization opportunities
- Impact and effort assessments

## Component Architecture

```
RoleComparison/
├── RoleComparison.tsx          # Main container component
├── RoleSelector.tsx            # Role selection interface
├── ComparisonMatrix.tsx        # Permission matrix view
├── ComparisonDiff.tsx          # Differences view
├── ComparisonSummary.tsx       # Summary statistics
├── ComparisonChart.tsx         # Chart container
├── ComparisonExport.tsx        # Export functionality
├── charts/
│   ├── StatisticalChart.tsx    # Statistical analysis
│   ├── VennDiagramChart.tsx    # Overlap visualization
│   ├── HeatmapChart.tsx        # Coverage heatmap
│   └── NetworkChart.tsx        # Relationship graph
└── index.ts                    # Exports
```

## Usage Examples

### Basic Role Comparison
```tsx
import { RoleComparison } from '@/components/RoleComparison';

<RoleComparison
  maxRoles={4}
  autoAnalyze={true}
  showExport={true}
  showVisualizations={true}
/>
```

### With Initial Roles
```tsx
<RoleComparison
  initialRoles={['PLATFORM_ADMIN', 'PROPERTY_MANAGER']}
  maxRoles={3}
  autoAnalyze={true}
/>
```

### Audit Mode
```tsx
<RoleComparison
  maxRoles={6}
  autoAnalyze={false}
  showExport={true}
  className="audit-mode"
/>
```

## Hooks

### useRoleComparison
Main hook for role comparison logic:

```tsx
const {
  comparison,
  selectedRoles,
  availableRoles,
  isLoading,
  isAnalyzing,
  error,
  selectRole,
  unselectRole,
  analyzeRoles,
} = useRoleComparison({ maxRoles: 4, autoAnalyze: true });
```

### useComparisonAnalytics
Advanced analytics and visualization data:

```tsx
const {
  vennDiagramData,
  networkGraphData,
  heatmapData,
  statisticalSummary,
  categoryAnalysis,
} = useComparisonAnalytics({ roles, matrix, metrics });
```

## Data Flow

1. **Role Selection**: Users select roles using the RoleSelector component
2. **Data Loading**: Available roles and permissions are fetched via useRoles hook
3. **Analysis**: Selected roles are analyzed to compute metrics and differences
4. **Visualization**: Results are rendered in various views (matrix, diff, charts)
5. **Export**: Users can export results in multiple formats

## Key Metrics

### Similarity Score
Jaccard index calculating permission overlap between roles:
```
similarity = intersection / union
```

### Coverage Gap
Percentage of permissions not shared by all roles:
```
coverageGap = (total - shared) / total
```

### Permission Density
Average number of permissions per role:
```
density = totalPermissions / roleCount
```

## Performance Considerations

- **Caching**: Permission checks are cached for performance
- **Virtual Scrolling**: Large permission lists use virtual scrolling
- **Debounced Updates**: UI updates are debounced during analysis
- **Efficient Comparison**: Optimized algorithms for role similarity

## Accessibility

- Full ARIA support for screen readers
- Keyboard navigation for all interactive elements
- High contrast mode compatibility
- Focus management and visual indicators
- Semantic HTML structure

## Testing

The Role Comparison Tool includes comprehensive tests:

- Unit tests for comparison algorithms
- Integration tests for user workflows
- Accessibility tests for WCAG compliance
- Performance tests for large datasets

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement approach
- Graceful degradation for older browsers

## Integration

The Role Comparison Tool integrates with:

- **Permission System**: Uses existing RBAC + ABAC implementation
- **Role Service**: Leverages role management APIs
- **Export System**: Integrates with document generation services
- **Analytics**: Connects to usage tracking and metrics

## Customization

The tool supports various customization options:

- **Themes**: Custom color schemes and branding
- **Layouts**: Configurable view arrangements
- **Filters**: Custom permission filtering logic
- **Export Formats**: Additional export format plugins
- **Visualizations**: Custom chart types and data representations

## Future Enhancements

- **Real-time Collaboration**: Multi-user comparison sessions
- **Historical Analysis**: Role evolution tracking over time
- **Automated Recommendations**: ML-powered optimization suggestions
- **Advanced Visualizations**: 3D network graphs, animated transitions
- **Integration APIs**: RESTful APIs for external tool integration
