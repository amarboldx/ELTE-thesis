package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.Request.CreateItemRequest;
import Thesis.RMS.Application.UseCases.ItemUseCases;
import Thesis.RMS.Domain.Enums.Allergen_List;
import Thesis.RMS.Domain.Model.Item;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/menu")
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class ItemController {

    private final ItemUseCases itemUseCases;

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PostMapping
    public ResponseEntity<Item> createItem(@RequestBody CreateItemRequest createItemRequest) {
        Item newItem = itemUseCases.createItem(
                createItemRequest.getName(),
                createItemRequest.getDescription(),
                createItemRequest.getPrice(),
                createItemRequest.getAllergens()
        );
        return ResponseEntity.ok(newItem);
    }


    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(itemUseCases.getItemById(id));
    }

    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        return ResponseEntity.ok(itemUseCases.getItems());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Item>> getAvailableItems() {
        return ResponseEntity.ok(itemUseCases.getAvailableItems());
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(
            @PathVariable Long id,
            @RequestBody String name,
            @RequestBody String description,
            @RequestBody double price,
            @RequestBody List<Allergen_List> allergens,
            @RequestBody boolean available) {
        Item updatedItem = itemUseCases.updateItem(id, name, description, price, allergens, available);
        return ResponseEntity.ok(updatedItem);
    }
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemUseCases.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PatchMapping("/{id}/availability")
    public ResponseEntity<Void> updateItemAvailability(@PathVariable Long id, @RequestParam boolean available) {
        itemUseCases.updateItemAvailability(id, available);
        return ResponseEntity.ok().build();
    }
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PatchMapping("/{id}/price")
    public ResponseEntity<Void> updateItemPrice(@PathVariable Long id, @RequestParam double price) {
        itemUseCases.updateItemPrice(id, price);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/by-name")
    public ResponseEntity<Item> getItemByName(@RequestParam String name) {
        return ResponseEntity.ok(itemUseCases.getByName(name));
    }

    @GetMapping("/by-allergens")
    public ResponseEntity<List<Item>> getItemsByAllergen(@RequestParam List<Allergen_List> allergens) {
        return ResponseEntity.ok(itemUseCases.getItemsByAllergen(allergens));
    }
}
