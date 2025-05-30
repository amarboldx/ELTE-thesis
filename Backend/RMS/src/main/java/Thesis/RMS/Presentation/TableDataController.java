package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.TableDataDTO;
import Thesis.RMS.Application.UseCases.TableDataUseCases;
import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Enums.TableShape;
import Thesis.RMS.Domain.Enums.TableStatus;
import Thesis.RMS.Domain.Model.TableData;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/table")
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class TableDataController {
    private final TableDataUseCases tableDataUseCases;

    @Transactional
    @GetMapping
    public ResponseEntity<List<TableDataDTO>> getAllTables() {
        List<TableDataDTO> tables = tableDataUseCases.getAllTables();
        return ResponseEntity.ok(tables);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PostMapping
    public ResponseEntity<TableDataDTO> createTable(@RequestBody TableDataDTO tableDataDTO) {
        TableData tableData = new TableData();

        tableData.setTableNumber(tableDataDTO.getTableNumber());
        tableData.setTableStatus(tableDataDTO.getTableStatus());
        tableData.setOrderStatus(tableDataDTO.getOrderStatus());
        tableData.setShape(TableShape.valueOf(tableDataDTO.getShape()));
        tableData.setX(tableDataDTO.getX());
        tableData.setY(tableDataDTO.getY());
        tableData.setWidth(tableDataDTO.getWidth());
        tableData.setHeight(tableDataDTO.getHeight());
        tableData.setRadius(tableDataDTO.getRadius());
        tableData.setFloor(tableDataDTO.getFloor());

        TableDataDTO createdTable = tableDataUseCases.createTable(tableData);

        return ResponseEntity.ok(createdTable);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PutMapping("/{tableId}")
    public ResponseEntity<TableDataDTO> updateTable(@PathVariable Long tableId, @RequestBody TableDataDTO tableDataDTO) {
        TableData tableData = new TableData();

        tableData.setTableNumber(tableDataDTO.getTableNumber());
        tableData.setTableStatus(tableDataDTO.getTableStatus());
        tableData.setOrderStatus(tableDataDTO.getOrderStatus());
        tableData.setShape(TableShape.valueOf(tableDataDTO.getShape()));
        tableData.setX(tableDataDTO.getX());
        tableData.setY(tableDataDTO.getY());
        tableData.setWidth(tableDataDTO.getWidth());
        tableData.setHeight(tableDataDTO.getHeight());
        tableData.setRadius(tableDataDTO.getRadius());
        tableData.setFloor(tableDataDTO.getFloor());

        TableDataDTO updatedTable = tableDataUseCases.updateTable(tableId, tableData);
        if (updatedTable == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedTable);
    }


    @Transactional
    @GetMapping("/{tableId}")
    public ResponseEntity<TableDataDTO> getTableById(@PathVariable Long tableId) {
        TableDataDTO table = tableDataUseCases.getTableById(tableId);
        return table != null ? ResponseEntity.ok(table) : ResponseEntity.notFound().build();
    }
    @Transactional
    @GetMapping("/tableNumber/{tableNumber}")
    public ResponseEntity<TableDataDTO> getTableByTableNumber(@PathVariable int tableNumber) {
        TableDataDTO table = tableDataUseCases.getTableByTableNumber(tableNumber);
        return table != null ? ResponseEntity.ok(table) : ResponseEntity.notFound().build();
    }
    @Transactional
    @GetMapping("/staff/{staffId}")
    public ResponseEntity<TableDataDTO> getTableByStaffId(@PathVariable Long staffId) {
        TableDataDTO table = tableDataUseCases.getTableByStaffId(staffId);
        return table != null ? ResponseEntity.ok(table) : ResponseEntity.notFound().build();
    }
    @Transactional
    @GetMapping("/status/{status}")
    public ResponseEntity<List<TableDataDTO>> getTablesByStatus(@PathVariable TableStatus status) {
        List<TableDataDTO> tables = tableDataUseCases.getTablesByTableStatus(status);
        return ResponseEntity.ok(tables);
    }
    @Transactional
    @GetMapping("/orderStatus/{orderStatus}")
    public ResponseEntity<List<TableDataDTO>> getTablesByOrderStatus(@PathVariable OrderStatus orderStatus) {
        List<TableDataDTO> tables = tableDataUseCases.getTablesByOrderStatus(orderStatus);
        return ResponseEntity.ok(tables);
    }



    @Transactional
    @GetMapping("/floor/{floor}")
    public ResponseEntity<List<TableDataDTO>> getTablesByFloor(@PathVariable int floor) {
        List<TableDataDTO> tables = tableDataUseCases.getTablesByFloor(floor);
        return ResponseEntity.ok(tables);
    }
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PutMapping("/{tableId}/status")
    public ResponseEntity<String> updateTableStatus(@PathVariable Long tableId) {
        tableDataUseCases.updateTableStatus(tableId);
        return ResponseEntity.ok("Table status updated successfully.");
    }
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/{tableId}")
    public ResponseEntity<String> deleteTable(@PathVariable Long tableId) {
        tableDataUseCases.deleteTableById(tableId);
        return ResponseEntity.ok("Table deleted successfully.");
    }
}
