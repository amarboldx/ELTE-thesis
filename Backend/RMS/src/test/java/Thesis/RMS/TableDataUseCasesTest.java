package Thesis.RMS;

import Thesis.RMS.Application.UseCases.TableDataUseCases;
import Thesis.RMS.Domain.Enums.TableShape;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.TableRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TableDataUseCasesTest {

    private TableRepository tableRepository;
    private TableDataUseCases useCases;

    @BeforeEach
    void setUp() {
        tableRepository = mock(TableRepository.class);
        useCases = new TableDataUseCases(tableRepository);
    }

    @Test
    void createTable_withNoOverlapRectangle_shouldSucceed() {
        TableData existingTable = createRectangleTable(1L, 0, 0, 100, 100, 1);
        TableData newTable = createRectangleTable(null, 200, 200, 100, 100, 1);

        when(tableRepository.findByFloor(1)).thenReturn(List.of(existingTable));
        when(tableRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> useCases.createTable(newTable));
        verify(tableRepository).save(newTable);
    }

    @Test
    void createTable_withOverlappingRectangles_shouldThrowException() {
        TableData existingTable = createRectangleTable(1L, 0, 0, 100, 100, 1);
        TableData overlappingTable = createRectangleTable(null, 50, 50, 100, 100, 1);

        when(tableRepository.findByFloor(1)).thenReturn(List.of(existingTable));

        Exception ex = assertThrows(IllegalArgumentException.class,
                () -> useCases.createTable(overlappingTable));

        assertEquals("Table placement is invalid: overlaps with another table.", ex.getMessage());
    }

    @Test
    void createTable_withNoOverlapCircles_shouldSucceed() {
        TableData existing = createCircleTable(1L, 0, 0, 30, 1);
        TableData newCircle = createCircleTable(null, 100, 100, 30, 1);

        when(tableRepository.findByFloor(1)).thenReturn(List.of(existing));
        when(tableRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> useCases.createTable(newCircle));
        verify(tableRepository).save(newCircle);
    }

    @Test
    void createTable_withOverlappingCircles_shouldThrowException() {
        TableData existing = createCircleTable(1L, 0, 0, 50, 1);
        TableData overlapping = createCircleTable(null, 40, 30, 50, 1); // overlap

        when(tableRepository.findByFloor(1)).thenReturn(List.of(existing));

        Exception ex = assertThrows(IllegalArgumentException.class,
                () -> useCases.createTable(overlapping));

        assertEquals("Table placement is invalid: overlaps with another table.", ex.getMessage());
    }

    @Test
    void createTable_withOverlappingRectangleAndCircle_shouldThrowException() {
        TableData rectangle = createRectangleTable(1L, 50, 50, 100, 100, 1);
        TableData circle = createCircleTable(null, 100, 100, 60, 1); // should overlap

        when(tableRepository.findByFloor(1)).thenReturn(List.of(rectangle));

        Exception ex = assertThrows(IllegalArgumentException.class,
                () -> useCases.createTable(circle));

        assertEquals("Table placement is invalid: overlaps with another table.", ex.getMessage());
    }

    @Test
    void createTable_withNoOverlapRectangleAndCircle_shouldSucceed() {
        TableData rectangle = createRectangleTable(1L, 0, 0, 100, 100, 1);
        TableData circle = createCircleTable(null, 200, 200, 30, 1); // no overlap

        when(tableRepository.findByFloor(1)).thenReturn(List.of(rectangle));
        when(tableRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> useCases.createTable(circle));
        verify(tableRepository).save(circle);
    }



    private TableData createRectangleTable(Long id, int x, int y, int width, int height, int floor) {
        TableData table = new TableData();
        table.setId(id);
        table.setShape(TableShape.RECTANGLE);
        table.setX(x);
        table.setY(y);
        table.setWidth(width);
        table.setHeight(height);
        table.setFloor(floor);
        return table;
    }

    private TableData createCircleTable(Long id, int x, int y, int radius, int floor) {
        TableData table = new TableData();
        table.setId(id);
        table.setShape(TableShape.CIRCLE);
        table.setX(x);
        table.setY(y);
        table.setRadius(radius);
        table.setFloor(floor);
        return table;
    }
}