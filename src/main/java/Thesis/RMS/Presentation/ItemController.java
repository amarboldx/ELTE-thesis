package Thesis.RMS.Presentation;


import Thesis.RMS.Application.UseCases.ItemUseCases;
import Thesis.RMS.Domain.Enums.Allergen_List;
import Thesis.RMS.Domain.Model.Item;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/menu")
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class ItemController {

    private final ItemUseCases itemUseCases;
    @PostMapping
    public ResponseEntity<Item> createItem(
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam double price,
            @RequestParam List<Allergen_List> allergens) {
        Item newItem = itemUseCases.createItem(name, description, price, allergens);
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


    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam double price,
            @RequestParam List<Allergen_List> allergens,
            @RequestParam boolean available) {
        Item updatedItem = itemUseCases.updateItem(id, name, description, price, allergens, available);
        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemUseCases.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<Void> updateItemAvailability(@PathVariable Long id, @RequestParam boolean available) {
        itemUseCases.updateItemAvailability(id, available);
        return ResponseEntity.ok().build();
    }

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
