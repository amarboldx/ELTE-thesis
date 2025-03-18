package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.TableDataDTO;
import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Enums.TableShape;
import Thesis.RMS.Domain.Enums.TableStatus;
import Thesis.RMS.Domain.Model.Order;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor(onConstructor_ = @Autowired)
public class TableDataUseCases {
    private final TableRepository tableDataRepository;


    private void validateNoOverlap(TableData newTable) {
        List<TableData> existingTables = tableDataRepository.findByFloor(newTable.getFloor());

        for (TableData existingTable : existingTables) {
            if (isOverlapping(existingTable, newTable)) {
                throw new IllegalArgumentException("Table placement is invalid: overlaps with another table.");
            }
        }
    }

    private boolean isOverlapping(TableData table1, TableData table2) {
        if (table1.getShape() == TableShape.RECTANGLE && table2.getShape() == TableShape.RECTANGLE) {
            return isRectangleOverlap(table1, table2);
        } else if (table1.getShape() == TableShape.CIRCLE && table2.getShape() == TableShape.CIRCLE) {
            return isCircleOverlap(table1, table2);
        } else if (table1.getShape() == TableShape.RECTANGLE && table2.getShape() == TableShape.CIRCLE) {
            return isCircleRectangleOverlap(table2, table1); // Circle is first parameter
        } else {
            return isCircleRectangleOverlap(table1, table2); // Circle is first parameter
        }
    }

    private boolean isRectangleOverlap(TableData rect1, TableData rect2) {
        int r1Left = rect1.getX();
        int r1Right = rect1.getX() + rect1.getWidth();
        int r1Top = rect1.getY();
        int r1Bottom = rect1.getY() + rect1.getHeight();

        int r2Left = rect2.getX();
        int r2Right = rect2.getX() + rect2.getWidth();
        int r2Top = rect2.getY();
        int r2Bottom = rect2.getY() + rect2.getHeight();

        return r1Left < r2Right && r1Right > r2Left &&
                r1Top < r2Bottom && r1Bottom > r2Top;
    }

    private boolean isCircleOverlap(TableData circle1, TableData circle2) {
        double dx = circle1.getX() - circle2.getX();
        double dy = circle1.getY() - circle2.getY();
        double distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circle1.getRadius() + circle2.getRadius());
    }

    private boolean isCircleRectangleOverlap(TableData circle, TableData rect) {
        int circleX = circle.getX();
        int circleY = circle.getY();
        int radius = circle.getRadius();

        int rectLeft = rect.getX();
        int rectRight = rect.getX() + rect.getWidth();
        int rectTop = rect.getY();
        int rectBottom = rect.getY() + rect.getHeight();

        int closestX = Math.max(rectLeft, Math.min(circleX, rectRight));
        int closestY = Math.max(rectTop, Math.min(circleY, rectBottom));

        int dx = circleX - closestX;
        int dy = circleY - closestY;

        return (dx * dx + dy * dy) < (radius * radius);
    }

    @Transactional
    public TableDataDTO createTable(TableData tableData) {
        validateNoOverlap(tableData);
        TableData savedTableData = tableDataRepository.save(tableData);
        return toTableDataDTO(savedTableData);
    }

    public TableDataDTO getTableById(Long tableId) {
        TableData tableData = tableDataRepository.findById(tableId).orElse(null);
        return tableData != null ? toTableDataDTO(tableData) : null;
    }

    public TableDataDTO getTableByTableNumber(int tableNumber) {
        TableData tableData = tableDataRepository.findByTableNumber(tableNumber).orElse(null);
        return tableData != null ? toTableDataDTO(tableData) : null;
    }

    public TableDataDTO getTableByStaffId(Long staffId) {
        TableData tableData = tableDataRepository.findByStaffId(staffId).orElse(null);
        return tableData != null ? toTableDataDTO(tableData) : null;
    }

    public List<TableDataDTO> getTablesByTableStatus(TableStatus tableStatus) {
        List<TableData> tables = tableDataRepository.findByTableStatus(tableStatus);
        return tables.stream()
                .map(this::toTableDataDTO)
                .collect(Collectors.toList());
    }

    public List<TableDataDTO> getAllTables() {
        List<TableData> tables = tableDataRepository.findAll();
        return tables.stream()
                .map(this::toTableDataDTO)
                .collect(Collectors.toList());
    }

    public List<TableDataDTO> getTablesByOrderStatus(OrderStatus status) {
        List<TableData> tables = tableDataRepository.findByOrderStatus(status);
        return tables.stream()
                .map(this::toTableDataDTO)
                .collect(Collectors.toList());
    }

    public void deleteTableById(Long tableId) {
        tableDataRepository.deleteById(tableId);
    }

    public List<TableDataDTO> getTablesByFloor(int floor) {
        List<TableData> tables = tableDataRepository.findByFloor(floor);
        return tables.stream()
                .map(this::toTableDataDTO)
                .collect(Collectors.toList());
    }

    public void updateTableStatus(Long tableId) {
        TableData tableData = tableDataRepository.findById(tableId).orElse(null);
        if (tableData != null) {
            List<Order> orders = tableData.getOrders();

            boolean allOrdersCompletedOrCancelled = orders.stream()
                    .allMatch(order -> order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED);

            if (allOrdersCompletedOrCancelled) {
                tableData.setOrderStatus(OrderStatus.COMPLETED);
            } else {
                tableData.setOrderStatus(OrderStatus.IN_PROGRESS);
            }

            tableDataRepository.save(tableData);
        }
    }

    private TableDataDTO toTableDataDTO(TableData tableData) {
        TableDataDTO tableDataDTO = new TableDataDTO();
        tableDataDTO.setId(tableData.getId());
        tableDataDTO.setTableNumber(tableData.getTableNumber());
        tableDataDTO.setOrderStatus(tableData.getOrderStatus());
        tableDataDTO.setTableStatus(tableData.getTableStatus());

        List<Long> orderIds = tableData.getOrders().stream()
                .map(order -> order.getId())
                .collect(Collectors.toList());
        tableDataDTO.setOrderIds(orderIds);

        tableDataDTO.setAssignedStaffId(tableData.getAssignedStaff() != null ? tableData.getAssignedStaff().getStaffId() : null);
        
        tableDataDTO.setShape(tableData.getShape().name());
        tableDataDTO.setX(tableData.getX());
        tableDataDTO.setY(tableData.getY());
        tableDataDTO.setWidth(tableData.getWidth());
        tableDataDTO.setHeight(tableData.getHeight());
        tableDataDTO.setRadius(tableData.getRadius());
        tableDataDTO.setFloor(tableData.getFloor());

        return tableDataDTO;
    }
}
