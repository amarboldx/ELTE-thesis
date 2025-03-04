package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Domain.Enums.Allergen_List;
import Thesis.RMS.Domain.Model.Item;
import Thesis.RMS.Domain.Repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class ItemUseCases {
    private final ItemRepository itemRepository;

    public Item createItem(String name, String description, double price, List<Allergen_List> allergenLists) {
        Item item = new Item();
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setAllergenList(allergenLists);
        item.setAvailable(true);

        return itemRepository.save(item);
    }

    public void deleteItem(Long itemId) {
        itemRepository.deleteById(itemId);
    }

    public Item updateItem(Long itemId, String name, String description, double price, List<Allergen_List> allergenLists, boolean available) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setAllergenList(allergenLists);
        item.setAvailable(available);

        return itemRepository.save(item);
    }

    public List<Item> getItems() {
        return itemRepository.findAll();
    }

    public List<Item> getAvailableItems() {
        return itemRepository.findByAvailable(true);
    }

    public List<Item> getItemsByAllergen(List<Allergen_List> allergenList) {
        return itemRepository.findByAllergenLists(allergenList);
    }

    public void updateItemAvailability(Long itemId, boolean available) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
        item.setAvailable(available);

        itemRepository.save(item);
    }

    public void updateItemPrice(Long itemId, double price) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
        item.setPrice(price);

        itemRepository.save(item);
    }

    public Item getItemById(Long itemId) {
        return itemRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));
    }

    public Item getByName(String name) {
        return itemRepository.findByName(name).getFirst();
    }
}
